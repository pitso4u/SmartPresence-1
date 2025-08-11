const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { db } = require('../config');

// Helper function to run SQL queries with promises
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

// Helper function to get rows with promises
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = {
  up: async (db) => {
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
      
      // Add a default admin user if no users exist
      const existingUsers = await all('SELECT id FROM users LIMIT 1');
      if (!existingUsers || existingUsers.length === 0) {
        const adminPassword = await bcrypt.hash('admin123', 10);
        await run(
          'INSERT INTO users (client_uuid, username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), 'admin', 'admin@school.edu', adminPassword, 'Administrator', 'admin', 1]
        );
      }
      
      console.log('Users table migration completed successfully');
      return true;
    } catch (error) {
      console.error('Error in users table migration:', error);
      throw error;
    }
  },
  
  // Add down migration for rollback if needed
  down: async (db) => {
    try {
      await run('DROP TABLE IF EXISTS users');
      console.log('Dropped users table');
      return true;
    } catch (error) {
      console.error('Error dropping users table:', error);
      throw error;
    }
  }
};
