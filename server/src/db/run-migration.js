const { run } = require('./config');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_add_qr_code_path_to_cards.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    logger.info('Running migration: 003_add_qr_code_path_to_cards.sql');
    
    // Execute the migration
    await run('BEGIN TRANSACTION');
    try {
      // Split the SQL file into individual statements and execute them
      const statements = migrationSQL.split(';').filter(statement => statement.trim() !== '');
      
      for (const statement of statements) {
        if (statement.trim() === '') continue;
        await run(statement);
      }
      
      await run('COMMIT');
      logger.info('Migration completed successfully');
      process.exit(0);
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
