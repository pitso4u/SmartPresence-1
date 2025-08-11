const fs = require('fs');
const path = require('path');
const { run, query } = require('./src/db/config');
const { logger } = require('./src/utils/logger');

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.js') && file !== 'migrate.js')
      .sort();

    // Get already run migrations
    const runMigrations = await query('SELECT name FROM migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));

    // Run new migrations
    for (const file of files) {
      if (!runMigrationNames.has(file)) {
        logger.info(`Running migration: ${file}`);
        const migration = require(path.join(migrationDir, file));
        await migration.up();
        await run('INSERT INTO migrations (name) VALUES (?)', [file]);
        logger.info(`Completed migration: ${file}`);
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
