const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'tlaleho_ya_nako_server.db');
const migrationsPath = path.join(__dirname, 'migrations');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('SQLite connection error:', err.message);
  } else {
    logger.info(`Connected to the SQLite database at ${dbPath}`);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper function to execute SQL queries with Promise support
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error(`Query error: ${sql}`, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to execute run statements (INSERT, UPDATE, DELETE)
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        logger.error(`Run error: ${sql}`, err);
        reject(err);
      } else {
        // For INSERT, UPDATE, DELETE, this.lastID and this.changes are useful
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Function to run database migrations
const runMigrations = async () => {
  try {
    // Create migrations table if it doesn't exist
    await run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get already run migrations
    const runMigrations = await query('SELECT name FROM migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));

    // Run new migrations
    for (const file of migrationFiles) {
      if (!runMigrationNames.has(file)) {
        logger.info(`Running migration: ${file}`);
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Wrap in a transaction
        await run('BEGIN TRANSACTION');
        try {
          // Execute the entire migration file as a single statement
          await run(migrationSQL);
          
          // Record the migration
          await run('INSERT INTO migrations (name) VALUES (?)', [file]);
          await run('COMMIT');
          logger.info(`Successfully ran migration: ${file}`);
        } catch (err) {
          await run('ROLLBACK');
          logger.error(`Error running migration ${file}:`, err);
          throw err;
        }
      }
    }
    
    logger.info('Database migrations completed successfully');
  } catch (err) {
    logger.error('Error running migrations:', err);
    throw err;
  }
};

// Function to initialize the database
const initDatabase = async () => {
  try {
    await runMigrations();
    logger.info('Database initialization completed');  
  } catch (err) {
    logger.error('Failed to initialize database:', err);
    throw err;
  }
};

module.exports = {
  db,
  query,
  run,
  initDatabase
};
