require('dotenv').config();
const { db, run } = require('./config');
const { logger } = require('../utils/logger');

const updateStatements = [
  // Add missing columns to visitors table
  `ALTER TABLE visitors ADD COLUMN phone_number TEXT`,
  `ALTER TABLE visitors ADD COLUMN email TEXT`
];

const updateVisitorSchema = async () => {
  logger.info('Starting visitor database schema update...');
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
    logger.info('Visitor database schema update completed successfully.');
  } catch (err) {
    logger.error('Error during visitor database schema update:', err);
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

updateVisitorSchema();
