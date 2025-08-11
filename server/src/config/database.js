const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');

// Path to the SQLite database file
const dbPath = path.join(__dirname, '../../src/db/database.sqlite');

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error connecting to SQLite database:', err.message);
  } else {
    logger.info('Connected to the SQLite database.');
    
    // Enable foreign key constraints
    db.get('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.get('PRAGMA journal_mode = WAL');
  }
});

// Handle database connection errors
db.on('error', (err) => {
  logger.error('Database error:', err.message);
});

// Promisify database methods for async/await
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Export both the database connection and promisified methods
module.exports = {
  db,
  get: dbGet,
  all: dbAll,
  run: dbRun,
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) return reject(err);
        logger.info('Database connection closed.');
        resolve();
      });
    });
  }
};
