require('dotenv').config();
const { run, db } = require('./config');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Database migration script for SmartPresence
 * This script handles the creation and updates of database tables
 */

// SQL migration statements
const migrationStatements = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'teacher', 'staff')) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`,
  
  // Users table indexes
  `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  
  // Incidents table
  `CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    user_type TEXT CHECK(user_type IN ('student', 'employee')),
    description TEXT NOT NULL,
    incident_type TEXT,
    reporter_name TEXT,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`,
  
  // Attendance logs table
  `CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    status TEXT NOT NULL,
    method TEXT NOT NULL,
    match_confidence REAL,
    synced INTEGER DEFAULT 0
  )`,
  
  // Students table
  `CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_code TEXT UNIQUE NOT NULL,
    id_number TEXT,
    grade TEXT,
    classroom TEXT,
    photo_path TEXT,
    face_vector BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`,
  
  // Employees table
  `CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    id_number TEXT,
    job_title TEXT,
    department TEXT,
    contact_number TEXT,
    email TEXT,
    photo_path TEXT,
    role TEXT,
    face_vector BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`,
  
  // Visitors table
  `CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    id_number TEXT,
    purpose TEXT,
    host TEXT,
    phone_number TEXT,
    email TEXT,
    photo_path TEXT,
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME,
    synced INTEGER DEFAULT 0
  )`,
  
  // Cards table
  `CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_uuid TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    user_type TEXT CHECK(user_type IN ('student', 'employee')),
    card_image_path TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`,
  
  // System settings table
  `CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

/**
 * Load and run migrations from files in the migrations directory
 */
const runFileMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      logger.info('Created migrations directory');
      return; // No migrations to run if directory was just created
    }
    
    // Load and sort migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    // Run each migration file
    for (const file of migrationFiles) {
      try {
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration.up === 'function') {
          await migration.up();
          logger.info(`Ran migration: ${file}`);
        }
      } catch (error) {
        logger.error(`Error running migration ${file}:`, error);
        throw error; // Stop execution if a migration fails
      }
    }
  } catch (error) {
    logger.error('Error in file migrations:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
const migrate = async () => {
  logger.info('Starting database migration...');
  
  try {
    // Run built-in migrations
    for (const statement of migrationStatements) {
      try {
        await run(statement);
      } catch (error) {
        // Log error but continue with other migrations
        logger.error(`Error running migration statement: ${error.message}`);
        logger.debug('Failed statement:', statement);
      }
    }
    
    // Run file-based migrations
    await runFileMigrations();
    
    logger.info('Database migration completed successfully.');
  } catch (error) {
    logger.error('Fatal error during database migration:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        logger.error('Error closing the database connection:', err.message);
        process.exit(1);
      } else {
        logger.info('Database connection closed.');
      }
    });
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate().catch(error => {
    logger.error('Unhandled error in migration:', error);
    process.exit(1);
  });
}

module.exports = { migrate };