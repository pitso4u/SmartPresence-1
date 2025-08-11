require('dotenv').config();
const { db, run } = require('./config');
const { logger } = require('../utils/logger');

const alterIncidentsTable = async () => {
  logger.info('Starting database migration: Adding client_uuid column to incidents table');
  try {
    // Add client_uuid column to incidents table
    await run(`
      ALTER TABLE incidents 
      ADD COLUMN client_uuid TEXT UNIQUE;
    `);
    
    logger.info('Successfully added client_uuid column to incidents table');
  } catch (err) {
    logger.error('Error adding client_uuid column to incidents table:', err);
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

// Run the migration
alterIncidentsTable();
