const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

const createIncident = async (req, res, next) => {
  try {
    const { user_id, user_type, description, incident_type, reporter_name, synced = 0 } = req.body;
    const reported_at = new Date().toISOString();
    const client_uuid = req.body.client_uuid || require('crypto').randomUUID();
    
    const sql = `
      INSERT INTO incidents (
        client_uuid, user_id, user_type, description, 
        incident_type, reporter_name, reported_at, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await run(sql, [
      client_uuid,
      user_id || null,
      user_type || null,
      description,
      incident_type || null,
      reporter_name,
      reported_at,
      synced
    ]);
    
    res.status(201).json({ 
      status: 'success', 
      data: { 
        id: result.lastID,
        client_uuid: client_uuid
      } 
    });
  } catch (error) {
    logger.error('Error in createIncident:', error);
    next(error);
  }
};

const getAllIncidents = async (req, res, next) => {
  try {
    const incidents = await query('SELECT * FROM incidents');
    res.status(200).json({ status: 'success', data: incidents });
  } catch (error) {
    logger.error('Error in getAllIncidents:', error);
    next(error);
  }
};

const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM incidents WHERE id = ?', [id]);
    const incident = rows[0];
    if (!incident) {
      return res.status(404).json({ status: 'error', message: 'Incident not found' });
    }
    res.status(200).json({ status: 'success', data: incident });
  } catch (error) {
    logger.error('Error in getIncidentById:', error);
    next(error);
  }
};

const updateIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, user_type, description, incident_type, reporter_name, synced } = req.body;
    
    const sql = `
      UPDATE incidents 
      SET 
        user_id = ?,
        user_type = ?,
        description = ?,
        incident_type = ?,
        reporter_name = ?,
        synced = ?
      WHERE id = ?;
    `;
    
    const result = await run(sql, [
      user_id || null,
      user_type || null,
      description,
      incident_type || null,
      reporter_name,
      synced || 0,
      id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Incident not found or no changes made' 
      });
    }
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Incident updated successfully' 
    });
  } catch (error) {
    logger.error('Error in updateIncidentById:', error);
    next(error);
  }
};

const deleteIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM incidents WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Incident not found' });
    }
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Error in deleteIncidentById:', error);
    next(error);
  }
};

const getDistinctIncidentTypes = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT incident_type FROM incidents WHERE incident_type IS NOT NULL ORDER BY incident_type');
    const incidentTypes = rows.map(row => row.incident_type);
    res.status(200).json({ status: 'success', data: incidentTypes });
  } catch (error) {
    logger.error('Error in getDistinctIncidentTypes:', error);
    next(error);
  }
};

const getDistinctReporters = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT reporter_name FROM incidents WHERE reporter_name IS NOT NULL ORDER BY reporter_name');
    const reporters = rows.map(row => row.reporter_name);
    res.status(200).json({ status: 'success', data: reporters });
  } catch (error) {
    logger.error('Error in getDistinctReporters:', error);
    next(error);
  }
};

const syncIncidents = async (req, res, next) => {
  try {
    const incidents = req.body;
    if (!Array.isArray(incidents) || incidents.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body must be a non-empty array of incidents.',
      });
    }

    logger.info(`Received request to sync ${incidents.length} incidents.`);

    const promises = incidents.map(incident => {
      const sql = `
        INSERT INTO incidents (
          client_uuid, user_id, user_type, description, 
          incident_type, reporter_name, reported_at, synced
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(client_uuid) DO UPDATE SET
          user_id = excluded.user_id,
          user_type = excluded.user_type,
          description = excluded.description,
          incident_type = excluded.incident_type,
          reporter_name = excluded.reporter_name,
          reported_at = COALESCE(excluded.reported_at, datetime('now')),
          synced = 1;
      `;
      
      const reportedAt = incident.reportedAt || new Date().toISOString();
      
      const params = [
        incident.id || require('crypto').randomUUID(),
        incident.userId || null,
        incident.userType || null,
        incident.description,
        incident.incidentType || null,
        incident.reporterName,
        reportedAt
      ];
      
      return run(sql, params);
    });

    await Promise.all(promises);

    logger.info(`Successfully synced ${incidents.length} incidents.`);
    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${incidents.length} incidents.`,
      data: { receivedCount: incidents.length },
    });
  } catch (error) {
    logger.error('Error in syncIncidents:', error);
    next(error);
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncidentById,
  deleteIncidentById,
  getDistinctIncidentTypes,
  getDistinctReporters,
  syncIncidents,
};
