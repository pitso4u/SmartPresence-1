require('dotenv').config();
const { db, query } = require('./config');
const { logger } = require('../utils/logger');

const checkSchema = async () => {
  logger.info('Checking database schema...');
  try {
    // Get list of all tables
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
    logger.info('Tables in database:', tables.map(t => t.name).join(', '));
    
    // Check incidents table schema
    const incidentsSchema = await query("PRAGMA table_info(incidents)");
    logger.info('Incidents table schema:', JSON.stringify(incidentsSchema, null, 2));
    
    // Check if client_uuid column exists
    const hasClientUuid = incidentsSchema.some(column => column.name === 'client_uuid');
    if (hasClientUuid) {
      logger.info('client_uuid column already exists in incidents table');
    } else {
      logger.warn('client_uuid column does NOT exist in incidents table');
    }
  } catch (err) {
    logger.error('Error checking schema:', err);
  } finally {
    db.close((err) => {
      if (err) {
        logger.error('Error closing database connection:', err);
      } else {
        logger.info('Database connection closed');
      }
    });
  }
};

checkSchema();
