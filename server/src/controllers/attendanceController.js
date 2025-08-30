const { run, query } = require('../db/config');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const axios = require('axios');
const attendanceService = require('../services/attendanceService');

// Configuration
const SYNC_ENDPOINT = process.env.API_BASE_URL ? 
  `${process.env.API_BASE_URL}/api/v1/attendance/sync` : 
  'http://localhost:3001/api/v1/attendance/sync';

// Track if we're currently syncing to prevent duplicate syncs
let isSyncing = false;
const pendingSyncs = [];

// Log attendance for a user using the new attendance service
const logAttendance = async (req, res) => {
  const { user_id, user_type, method = 'manual', match_confidence = null, isOffline = false } = req.body;
  const timestamp = req.body.timestamp || new Date().toISOString();
  
  try {
    // Convert user_id to number if it's a string
    const userId = parseInt(user_id, 10);
    
    // In offline mode, we skip user verification and direct DB checks
    if (!isOffline) {
      // Get user details to ensure they exist
      const userTable = user_type === 'student' ? 'students' : 'employees';
      const user = await query(`SELECT * FROM ${userTable} WHERE id = ?`, [userId]);
      
      if (!user || user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    // Process attendance using the new service
    const attendanceRecord = await attendanceService.processAttendance(
      userId, 
      user_type, 
      timestamp, 
      method, 
      match_confidence
    );
    
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
      WITH latest_attendance AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, user_type, DATE(timestamp) 
            ORDER BY COALESCE(updated_at, timestamp) DESC, timestamp DESC
          ) as rn
        FROM attendance_logs
        WHERE 1=1
    `;
    
    sql += `
        )
        SELECT al.*, 
               CASE 
                 WHEN s.full_name IS NOT NULL THEN s.full_name
                 WHEN e.full_name IS NOT NULL THEN e.full_name
                 ELSE 'Unknown User'
               END as user_name
        FROM latest_attendance al
        LEFT JOIN students s ON al.user_id = s.id AND al.user_type = 'student'
        LEFT JOIN employees e ON al.user_id = e.id AND al.user_type = 'employee'
        WHERE al.rn = 1
        ORDER BY al.timestamp DESC
    `;



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
    // Get the most recent attendance record for each user per day
    // Order by updated_at if available, otherwise by timestamp
    let sql = `
      WITH latest_attendance AS (
        SELECT 
          user_id,
          user_type,
          status,
          timestamp,
          updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, user_type, DATE(timestamp) 
            ORDER BY COALESCE(updated_at, timestamp) DESC, timestamp DESC
          ) as rn
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
    
    sql += `
        )
        SELECT 
          status,
          COUNT(*) as count
        FROM latest_attendance
        WHERE rn = 1
        GROUP BY status
    `;
    
    const result = await query(sql, params);
    
    // Convert to an object with status as keys
    const summary = result.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count);
      return acc;
    }, { present: 0, late: 0, absent: 0, excused: 0 });
    
    console.log('Attendance summary:', summary);
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
  const { status } = req.body;
  
  try {
    // First, get the current record to understand what we're updating
    const currentRecord = await query('SELECT * FROM attendance_logs WHERE id = ?', [id]);
    
    if (!currentRecord || currentRecord.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    const record = currentRecord[0];
    
    // Update the record with the new status
    await run(
      'UPDATE attendance_logs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    // Get the updated record
    const updated = await query('SELECT * FROM attendance_logs WHERE id = ?', [id]);
    
    logger.info(`Updated attendance record ${id} for user ${record.user_id} (${record.user_type}) from ${record.status} to ${status}`);
    
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

// Get face recognition logs for a specific user
const getFaceRecognitionLogs = async (req, res) => {
  const { user_id, user_type } = req.params;
  const { start_date, end_date } = req.query;
  
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
      WHERE al.user_id = ? AND al.user_type = ? AND al.method = 'face_recognition'
    `;
    
    const params = [user_id, user_type];
    
    if (start_date) {
      sql += ' AND al.timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      sql += ' AND al.timestamp <= ?';
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      params.push(endDateObj.toISOString());
    }
    
    sql += ' ORDER BY al.timestamp DESC';
    
    const logs = await query(sql, params);
    
    res.json(logs);
    
  } catch (error) {
    logger.error('Error fetching face recognition logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch face recognition logs',
      details: error.message 
    });
  }
};

// Log face recognition attendance
const logFaceRecognition = async (req, res) => {
  try {
    const { user_id, user_type, match_confidence } = req.body;
    const timestamp = new Date().toISOString();
    
    // Process attendance using the new service
    const attendanceRecord = await attendanceService.processAttendance(
      user_id,
      user_type,
      timestamp,
      'face_recognition',
      match_confidence
    );
    
    res.status(201).json(attendanceRecord);
    
  } catch (error) {
    logger.error('Error in face recognition attendance:', error);
    res.status(500).json({ 
      error: 'Failed to log face recognition attendance',
      details: error.message 
    });
  }
};

// Get face recognition summary
const getFaceRecognitionSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance_logs
      WHERE method = 'face_recognition'
    `;
    
    const params = [];
    
    if (start_date) {
      sql += ' AND timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      sql += ' AND timestamp <= ?';
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      params.push(endDateObj.toISOString());
    }
    
    sql += ' GROUP BY status';
    
    const result = await query(sql, params);
    
    // Convert to an object with status as keys
    const summary = result.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count);
      return acc;
    }, { present: 0, late: 0, absent: 0 });
    
    // Add total count
    summary.total = Object.values(summary).reduce((a, b) => a + b, 0);
    
    res.json(summary);
    
  } catch (error) {
    logger.error('Error fetching face recognition summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch face recognition summary',
      details: error.message 
    });
  }
};

// Initialize daily attendance manually
const initializeDailyAttendance = async (req, res) => {
  try {
    const count = await attendanceService.initializeDailyAttendance();
    res.json({ 
      message: `Daily attendance initialized for ${count} people`,
      count 
    });
  } catch (error) {
    logger.error('Error initializing daily attendance:', error);
    res.status(500).json({ 
      error: 'Failed to initialize daily attendance',
      details: error.message 
    });
  }
};

// Get today's attendance summary
const getTodayAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    const summary = await attendanceService.getAttendanceSummary(today);
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching today\'s attendance summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch today\'s attendance summary',
      details: error.message 
    });
  }
};

module.exports = {
  logAttendance,
  getFaceRecognitionLogs,
  logFaceRecognition,
  getAttendanceLogs,
  getAttendanceSummary,
  getFaceRecognitionSummary,
  getUserAttendance,
  updateAttendance,
  deleteAttendance,
  syncAttendance,
  checkUnsynced,
  initializeDailyAttendance,
  getTodayAttendanceSummary
};
