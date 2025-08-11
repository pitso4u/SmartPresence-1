const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the SQLite database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Define the correct migration order
const MIGRATION_ORDER = [
  '001_initial_schema.sql',
  '001_create_settings_table.sql',
  '002_add_updated_at_trigger.sql',
  '20240802000000_create_users_table.js',
  '20240802_add_users_table.js',
  '003_add_qr_code_path_to_cards.sql'
];

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to the SQLite database.');
  
  // Enable foreign key support
  db.get('PRAGMA foreign_keys = ON');
  
  // Enable WAL mode for better concurrency
  db.get('PRAGMA journal_mode = WAL');
  
  // Create tables and run migrations
  runMigrations();
});

// Function to run migrations in sequence
async function runMigrations() {
  try {
    // Start a transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create migrations table if it doesn't exist
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get already executed migrations
    const executedMigrations = await new Promise((resolve, reject) => {
      db.all('SELECT name FROM migrations', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });

    // Execute pending migrations in order
    for (const migrationFile of MIGRATION_ORDER) {
      if (executedMigrations.includes(migrationFile)) {
        console.log(`Skipping already executed migration: ${migrationFile}`);
        continue;
      }

      console.log(`Running migration: ${migrationFile}`);
      const migrationPath = path.join(__dirname, 'migrations', migrationFile);
      
      if (migrationFile.endsWith('.js')) {
        // For JavaScript migrations
        const migration = require(migrationPath);
        await migration.up(db);
      } else {
        // For SQL migrations
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await new Promise((resolve, reject) => {
          db.exec(migrationSQL, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Record the migration as executed
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO migrations (name) VALUES (?)', [migrationFile], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Commit the transaction
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else {
          console.log('All migrations completed successfully!');
          resolve();
        }
      });
    });
  } catch (error) {
    // Rollback on error
    await new Promise((resolve) => {
      db.run('ROLLBACK', () => {
        console.error('Migration failed. Rolling back changes.');
        console.error('Error:', error);
        resolve();
      });
    });
    process.exit(1);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err.message);
  process.exit(1);
});
