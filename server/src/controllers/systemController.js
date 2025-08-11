const db = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * @route GET /api/v1/system/status
 * @description Get system status information
 * @access Private (Admin only)
 */
const getSystemStatus = async (req, res) => {
  try {
    // Get database connection status
    let dbStatus = 'disconnected';
    try {
      await db.get('SELECT 1');
      dbStatus = 'connected';
    } catch (dbErr) {
      logger.error('Database connection check failed:', dbErr);
      dbStatus = 'error';
    }

    // Get server uptime (in minutes)
    const uptime = Math.floor(process.uptime() / 60);
    
    // Get current system load (simplified - in a real app, you might use os.loadavg() or similar)
    const systemLoad = Math.min(100, Math.floor(Math.random() * 50) + 5); // Random value between 5-55%
    
    // Get active users (simplified - in a real app, track active sessions)
    const activeUsers = Math.floor(Math.random() * 25) + 1; // Random value between 1-25

    // Get last sync time (example - in a real app, track last sync with external services)
    const lastSync = new Date().toISOString();

    res.status(200).json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          type: 'SQLite',
          version: await getDatabaseVersion()
        },
        server: {
          uptime,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          systemLoad,
          activeUsers,
          lastSync
        }
      }
    });
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get database version
async function getDatabaseVersion() {
  try {
    const result = await db.get('SELECT sqlite_version() as version');
    return result?.version || 'unknown';
  } catch (err) {
    logger.error('Error getting database version:', err);
    return 'unknown';
  }
}

module.exports = {
  getSystemStatus
};
