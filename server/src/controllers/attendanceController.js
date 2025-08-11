const { run, query } = require('../db/config');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const axios = require('axios');

// Configuration
const SYNC_ENDPOINT = process.env.API_BASE_URL ? 
  `${process.env.API_BASE_URL}/api/v1/attendance/sync` : 
  'http://localhost:3001/api/v1/attendance/sync';

// Track if we're currently syncing to prevent duplicate syncs
let isSyncing = false;
const pendingSyncs = [];

// Helper function to determine attendance status based on time
const getAttendanceStatus = (timestamp) => {
  const time = new Date(timestamp);
  const hours = time.getHours();
  const minutes = time.getMinutes();
  
  // Convert to minutes since midnight for easier comparison
  const totalMinutes = (hours * 60) + minutes;
  
  // Example thresholds (can be made configurable)
  const onTimeThreshold = 8 * 60;  // 8:00 AM
  const lateThreshold = 10 * 60;    // 10:00 AM
  
  if (totalMinutes <= onTimeThreshold) return 'present';
  if (totalMinutes <= lateThreshold) return 'late';
  return 'absent';
};

// Log attendance for a user
const logAttendance = async (req, res) => {
  const { user_id, user_type, method = 'manual', match_confidence = null, isOffline = false } = req.body;
  const client_uuid = req.body.client_uuid || uuidv4();
  const timestamp = req.body.timestamp || new Date().toISOString();
  
  try {
    // In offline mode, we skip user verification and direct DB checks
    if (!isOffline) {
      // Get user details to ensure they exist
      const userTable = user_type === 'student' ? 'students' : 'employees';
      const user = await query(`SELECT * FROM ${userTable} WHERE id = ?`, [user_id]);
      
      if (!user || user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    // Determine status based on time
    const status = req.body.status || getAttendanceStatus(timestamp);
    
    // Insert attendance record
    const result = await run(
      `INSERT INTO attendance_logs 
       (client_uuid, user_id, user_type, timestamp, status, method, match_confidence, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_uuid, user_id, user_type, timestamp, status, method, match_confidence, isOffline ? 0 : 1]
    );
    
    const attendanceRecord = {
      id: result.lastID,
      client_uuid,
      user_id,
      user_type,
      timestamp,
      status,
      method,
      match_confidence,
      synced: isOffline ? 0 : 1
    };
    
    // If this is an offline record, queue it for sync
    if (isOffline) {
      queueForSync(attendanceRecord);
    }
    
    res.status(201).json(attendanceRecord);
    
  } catch (error) {
    logger.error('Error logging attendance:', error);
    res.status(500).json({ error: 'Failed to log attendance', details: error.message });
  }
};

// Queue a record for sync
const queueForSync = (record) => {
  pendingSyncs.push(record);
  if (!isSyncing) {
    process.nextTick(processSyncQueue);
  }
};

// Process the sync queue
const processSyncQueue = async () => {
  if (isSyncing || pendingSyncs.length === 0) return;
  
  isSyncing = true;
  
  try {
    // Process records in chunks to avoid overloading the server
    const batchSize = 10;
    const batch = pendingSyncs.splice(0, batchSize);
    
    if (batch.length === 0) {
      isSyncing = false;
      return;
    }
    
    logger.info(`Syncing ${batch.length} attendance records...`);
    
    // Mark records as syncing
    await Promise.all(batch.map(record => 
      run('UPDATE attendance_logs SET syncing = 1 WHERE client_uuid = ?', [record.client_uuid])
    ));
    
    // Send to server
    const response = await axios.post(SYNC_ENDPOINT, batch, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 second timeout
    });
    
    // Mark as synced
    await Promise.all(batch.map(record => 
      run('UPDATE attendance_logs SET synced = 1, syncing = 0 WHERE client_uuid = ?', 
        [record.client_uuid])
    ));
    
    logger.info(`Successfully synced ${batch.length} attendance records`);
    
  } catch (error) {
    logger.error('Error syncing attendance records:', error);
    
    // Mark records as not syncing so they can be retried
    await Promise.all(batch.map(record => 
      run('UPDATE attendance_logs SET syncing = 0 WHERE client_uuid = ?', [record.client_uuid])
    ));
    
    // Retry after a delay (exponential backoff could be implemented here)
    setTimeout(processSyncQueue, 60000); // Retry after 1 minute
    return;
  } finally {
    isSyncing = false;
  }
  
  // Process next batch if any
  if (pendingSyncs.length > 0) {
    process.nextTick(processSyncQueue);
  }
};

// Get attendance logs with filters
const getAttendanceLogs = async (req, res) => {
  const { user_id, user_type, start_date, end_date, status } = req.query;
  
  try {
    let sql = `
      SELECT al.*, 
             CASE 
               WHEN s.full_name IS NOT NULL THEN s.full_name
               WHEN e.full_name IS NOT NULL THEN e.full_name
               ELSE 'Unknown User'
             END as user_name
      FROM attendance_logs al
      LEFT JOIN students s ON al.user_id = s.id AND al.user_type = 'student'
      LEFT JOIN employees e ON al.user_id = e.id AND al.user_type = 'employee'
      WHERE 1=1
    `;
    
    const params = [];
    
    if (user_id) {
      sql += ' AND al.user_id = ?';
      params.push(user_id);
    }
    
    if (user_type && user_type !== 'all') {
      sql += ' AND al.user_type = ?';
      params.push(user_type);
    }
    
    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }
    
    if (start_date && start_date.trim() !== '') {
      sql += ' AND al.timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date && end_date.trim() !== '') {
      sql += ' AND al.timestamp <= ?';
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999); // Set to the end of the day
      params.push(endDateObj.toISOString());
    }
    
    sql += ' ORDER BY al.timestamp DESC';



    const logs = await query(sql, params);
    res.json(logs);
    
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
};

// Get attendance summary (counts by status)
const getAttendanceSummary = async (req, res) => {
  const { start_date, end_date, user_type } = req.query;
  
  try {
    let sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance_logs
      WHERE 1=1
    `;
    
    const params = [];
    
    if (start_date) {
      sql += ' AND timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      sql += ' AND timestamp <= ?';
      params.push(new Date(end_date).toISOString());
    }
    
    if (user_type) {
      sql += ' AND user_type = ?';
      params.push(user_type);
    }
    
    sql += ' GROUP BY status';
    
    const result = await query(sql, params);
    
    // Convert to an object with status as keys
    const summary = result.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count);
      return acc;
    }, { present: 0, late: 0, absent: 0 });
    
    res.json(summary);
    
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

// Get attendance for a specific user
const getUserAttendance = async (req, res) => {
  const { user_id, user_type } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let sql = `
      SELECT * FROM attendance_logs 
      WHERE user_id = ? AND user_type = ?
    `;
    
    const params = [user_id, user_type];
    
    if (start_date) {
      sql += ' AND timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      sql += ' AND timestamp <= ?';
      params.push(new Date(end_date).toISOString());
    }
    
    sql += ' ORDER BY timestamp DESC';
    
    const logs = await query(sql, params);
    res.json(logs);
    
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ error: 'Failed to fetch user attendance' });
  }
};

// Update attendance record (for manual corrections)
const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  try {
    await run(
      'UPDATE attendance_logs SET status = ?, notes = ? WHERE id = ?',
      [status, notes, id]
    );
    
    const updated = await query('SELECT * FROM attendance_logs WHERE id = ?', [id]);
    
    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    res.json(updated[0]);
    
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Delete attendance record (admin only)
const deleteAttendance = async (req, res) => {
  const { id } = req.params;
  
  try {
    await run('DELETE FROM attendance_logs WHERE id = ?', [id]);
    res.status(204).send();
    
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
};

// Sync attendance records from client
const syncAttendance = async (req, res) => {
  const records = req.body;
  
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Expected an array of attendance records' });
  }
  
  try {
    const results = [];
    
    for (const record of records) {
      try {
        // Check if record already exists
        const existing = await query(
          'SELECT id FROM attendance_logs WHERE client_uuid = ?', 
          [record.client_uuid]
        );
        
        if (existing.length > 0) {
          results.push({ 
            client_uuid: record.client_uuid, 
            status: 'duplicate',
            id: existing[0].id
          });
          continue;
        }
        
        // Insert new record
        const result = await run(
          `INSERT INTO attendance_logs 
           (client_uuid, user_id, user_type, timestamp, status, method, match_confidence, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            record.client_uuid,
            record.user_id,
            record.user_type,
            record.timestamp,
            record.status,
            record.method,
            record.match_confidence
          ]
        );
        
        results.push({ 
          client_uuid: record.client_uuid, 
          status: 'synced',
          id: result.lastID
        });
        
      } catch (error) {
        logger.error(`Error processing record ${record.client_uuid}:`, error);
        results.push({ 
          client_uuid: record.client_uuid, 
          status: 'error',
          error: error.message 
        });
      }
    }
    
    res.json({ results });
    
  } catch (error) {
    logger.error('Error in syncAttendance:', error);
    res.status(500).json({ 
      error: 'Failed to sync attendance records',
      details: error.message 
    });
  }
};

// Check for unsynced records
const checkUnsynced = async (req, res) => {
  try {
    const unsynced = await query(
      'SELECT * FROM attendance_logs WHERE synced = 0 AND syncing = 0 LIMIT 100'
    );
    res.json({ count: unsynced.length, records: unsynced });
  } catch (error) {
    logger.error('Error checking for unsynced records:', error);
    res.status(500).json({ error: 'Failed to check for unsynced records' });
  }
};

module.exports = {
  logAttendance,
  getAttendanceLogs,
  getAttendanceSummary,
  getUserAttendance,
  updateAttendance,
  deleteAttendance,
  syncAttendance,
  checkUnsynced
};
