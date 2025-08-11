const { run, query } = require('./config');
const { logger } = require('../utils/logger');

/**
 * Initialize database tables if they don't exist
 */
const initializeDatabase = async () => {
  try {
    logger.info('Initializing database tables...');

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        full_name TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await run(createUsersTable);
    logger.info('Users table created/verified successfully');

    // Check if we need to create other tables
    const tables = ['students', 'employees', 'visitors', 'incidents', 'attendance_logs'];
    
    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        logger.info(`Table '${table}' exists`);
      } catch (error) {
        if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
          logger.warn(`Table '${table}' does not exist - you may need to create it`);
        }
      }
    }

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };
