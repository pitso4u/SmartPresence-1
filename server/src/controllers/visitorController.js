const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

const createVisitor = async (req, res, next) => {
  try {
    const { full_name, id_number, purpose, host, photo_path, entry_time, exit_time, synced, phone_number, email } = req.body;
    
    // Validate required fields
    if (!full_name) {
      logger.warn('Visitor creation failed: full_name is required');
      return res.status(400).json({ 
        status: 'error', 
        message: 'full_name is required'
      });
    }
    
    // Handle first/lastName to full_name conversion if needed
    let visitorFullName = full_name;
    if (!visitorFullName && req.body.firstName && req.body.lastName) {
      visitorFullName = `${req.body.firstName} ${req.body.lastName}`;
      logger.info(`Converted firstName/lastName to full_name: ${visitorFullName}`);
    }
    
    const sql = 'INSERT INTO visitors (full_name, id_number, purpose, host, photo_path, entry_time, exit_time, synced, phone_number, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const result = await run(sql, [
      visitorFullName, 
      id_number, 
      purpose, 
      host, 
      photo_path, 
      entry_time, 
      exit_time, 
      synced,
      phone_number || null,
      email || null
    ]);
    res.status(201).json({ status: 'success', data: { id: result.lastID } });
  } catch (error) {
    logger.error('Error in createVisitor:', error);
    next(error);
  }
};

const getAllVisitors = async (req, res, next) => {
  try {
    const visitors = await query('SELECT * FROM visitors');
    res.status(200).json({ status: 'success', data: visitors });
  } catch (error) {
    logger.error('Error in getAllVisitors:', error);
    next(error);
  }
};

const getVisitorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM visitors WHERE id = ?', [id]);
    const visitor = rows[0];
    if (!visitor) {
      return res.status(404).json({ status: 'error', message: 'Visitor not found' });
    }
    res.status(200).json({ status: 'success', data: visitor });
  } catch (error) {
    logger.error('Error in getVisitorById:', error);
    next(error);
  }
};

const updateVisitorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, id_number, purpose, host, photo_path, entry_time, exit_time, synced, phone_number, email } = req.body;
    const sql = 'UPDATE visitors SET full_name = ?, id_number = ?, purpose = ?, host = ?, photo_path = ?, entry_time = ?, exit_time = ?, synced = ?, phone_number = ?, email = ? WHERE id = ?';
    const result = await run(sql, [
      full_name, 
      id_number, 
      purpose, 
      host, 
      photo_path, 
      entry_time, 
      exit_time, 
      synced, 
      phone_number || null, 
      email || null,
      id
    ]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Visitor not found or no changes made' });
    }
    res.status(200).json({ status: 'success', message: 'Visitor updated successfully' });
  } catch (error) {
    logger.error('Error in updateVisitorById:', error);
    next(error);
  }
};

const deleteVisitorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM visitors WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Visitor not found' });
    }
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Error in deleteVisitorById:', error);
    next(error);
  }
};

const getDistinctPurposes = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT purpose FROM visitors WHERE purpose IS NOT NULL ORDER BY purpose');
    const purposes = rows.map(row => row.purpose);
    res.status(200).json({ status: 'success', data: purposes });
  } catch (error) {
    logger.error('Error in getDistinctPurposes:', error);
    next(error);
  }
};

const getDistinctHosts = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT host FROM visitors WHERE host IS NOT NULL ORDER BY host');
    const hosts = rows.map(row => row.host);
    res.status(200).json({ status: 'success', data: hosts });
  } catch (error) {
    logger.error('Error in getDistinctHosts:', error);
    next(error);
  }
};

const syncVisitors = async (req, res, next) => {
  try {
    const visitors = req.body;
    if (!Array.isArray(visitors) || visitors.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body must be a non-empty array of visitors.',
      });
    }

    logger.info(`Received request to sync ${visitors.length} visitors.`);

    const promises = visitors.map(visitor => {
      const sql = `
        INSERT INTO visitors (client_uuid, full_name, id_number, purpose, host, photo_path, entry_time, exit_time, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(client_uuid) DO UPDATE SET
          full_name = excluded.full_name,
          id_number = excluded.id_number,
          purpose = excluded.purpose,
          host = excluded.host,
          photo_path = excluded.photo_path,
          entry_time = excluded.entry_time,
          exit_time = excluded.exit_time,
          synced = 1;
      `;
      
      const params = [
        visitor.id,
        visitor.fullName,
        visitor.idNumber,
        visitor.purpose,
        visitor.host,
        visitor.photoPath,
        visitor.entryTime,
        visitor.exitTime,
      ];
      
      return run(sql, params);
    });

    await Promise.all(promises);

    logger.info(`Successfully synced ${visitors.length} visitors.`);
    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${visitors.length} visitors.`,
      data: { receivedCount: visitors.length },
    });
  } catch (error) {
    logger.error('Error in syncVisitors:', error);
    next(error);
  }
};

const checkOutVisitor = async (req, res) => {
  const { id } = req.params;
  const exit_time = new Date().toISOString();

  try {
    const sql = `UPDATE visitors SET exit_time = ?, synced = 0 WHERE id = ?`;
    await run(sql, [exit_time, id]);
    res.status(200).json({ message: `Visitor ${id} checked out successfully.` });
  } catch (error) {
    console.error(`Error checking out visitor ${id}:`, error);
    res.status(500).json({ message: 'Failed to check out visitor.', error: error.message });
  }
};

module.exports = {
  checkOutVisitor,
  createVisitor,
  getAllVisitors,
  getVisitorById,
  updateVisitorById,
  deleteVisitorById,
  getDistinctPurposes,
  getDistinctHosts,
  syncVisitors,
};
