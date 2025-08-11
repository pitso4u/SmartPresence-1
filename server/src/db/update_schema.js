require('dotenv').config();
const { db, run } = require('./config');
const { logger } = require('../utils/logger');

const updateStatements = [
  // Add missing columns to employees table
  `ALTER TABLE employees ADD COLUMN contact_number TEXT`,
  `ALTER TABLE employees ADD COLUMN email TEXT`,
  `ALTER TABLE employees ADD COLUMN role TEXT`,

  // Add missing columns to attendance_logs table
  `ALTER TABLE attendance_logs ADD COLUMN client_uuid TEXT`,
  `ALTER TABLE attendance_logs ADD COLUMN syncing INTEGER DEFAULT 0`,
  `ALTER TABLE attendance_logs ADD COLUMN status TEXT`,
  `ALTER TABLE attendance_logs ADD COLUMN method TEXT`,
  `ALTER TABLE attendance_logs ADD COLUMN match_confidence REAL`
];

const updateSchema = async () => {
  logger.info('Starting database schema update...');
  try {
    for (const statement of updateStatements) {
      try {
        await run(statement);
        logger.info(`Executed: ${statement}`);
      } catch (err) {
        // Ignore "duplicate column name" errors for columns that already exist
        if (err.message.includes('duplicate column name')) {
          logger.info(`Column already exists, skipping: ${statement}`);
        } else {
          throw err;
        }
      }
    }
    logger.info('Database schema update completed successfully.');
  } catch (err) {
    logger.error('Error during database schema update:', err);
  } finally {
    db.close((err) => {
      if (err) {
        logger.error('Error closing the database connection:', err.message);
      } else {
        logger.info('Database connection closed.');
      }
    });
  }
};

updateSchema();
