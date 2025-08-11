const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

const getAllSettings = async (req, res, next) => {
  try {
    const settings = await query('SELECT * FROM settings');
    res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    logger.error('Error in getAllSettings:', error);
    next(error);
  }
};

const getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const rows = await query('SELECT * FROM settings WHERE key = ?', [key]);
    const setting = rows[0];
    if (!setting) {
      return res.status(404).json({ status: 'error', message: 'Setting not found' });
    }
    res.status(200).json({ status: 'success', data: setting });
  } catch (error) {
    logger.error('Error in getSettingByKey:', error);
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    // Check if setting exists
    const existingRows = await query('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (existingRows.length === 0) {
      // Create new setting
      const sql = 'INSERT INTO settings (key, value, description) VALUES (?, ?, ?)';
      await run(sql, [key, value, description || null]);
      res.status(201).json({ status: 'success', message: 'Setting created successfully' });
    } else {
      // Update existing setting
      const sql = 'UPDATE settings SET value = ?, description = ? WHERE key = ?';
      await run(sql, [value, description || existingRows[0].description, key]);
      res.status(200).json({ status: 'success', message: 'Setting updated successfully' });
    }
  } catch (error) {
    logger.error('Error in updateSetting:', error);
    next(error);
  }
};

const deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const result = await run('DELETE FROM settings WHERE key = ?', [key]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Setting not found' });
    }
    res.status(200).json({ status: 'success', message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteSetting:', error);
    next(error);
  }
};

const getSystemInfo = async (req, res, next) => {
  try {
    const systemInfo = {
      serverTime: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      nodeVersion: process.version,
    };
    res.status(200).json({ status: 'success', data: systemInfo });
  } catch (error) {
    logger.error('Error in getSystemInfo:', error);
    next(error);
  }
};

const syncSettings = async (req, res, next) => {
  try {
    const settings = req.body;
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body must be a non-empty array of settings.',
      });
    }

    logger.info(`Received request to sync ${settings.length} settings.`);

    const promises = settings.map(setting => {
      const sql = `
        INSERT INTO settings (key, value, description)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = excluded.description;
      `;
      
      const params = [
        setting.key,
        setting.value,
        setting.description,
      ];
      
      return run(sql, params);
    });

    await Promise.all(promises);

    logger.info(`Successfully synced ${settings.length} settings.`);
    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${settings.length} settings.`,
      data: { receivedCount: settings.length },
    });
  } catch (error) {
    logger.error('Error in syncSettings:', error);
    next(error);
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  deleteSetting,
  getSystemInfo,
  syncSettings,
};
