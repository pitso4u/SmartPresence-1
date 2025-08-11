const { run } = require('../config');
const { logger } = require('../../utils/logger');

const migration = async () => {
  try {
    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_uuid TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'staff')),
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Create index for faster lookups
    await run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    
    logger.info('Users table migration completed successfully');
  } catch (error) {
    logger.error('Error in users table migration:', error);
    throw error;
  }
};

module.exports = migration;
