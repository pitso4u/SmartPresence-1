const { run } = require('../src/db/config');
const { logger } = require('../src/utils/logger');

async function up() {
  try {
    // Add qr_code_path column to cards table
    await run(`
      ALTER TABLE cards
      ADD COLUMN qr_code_path TEXT
    `);
    logger.info('Added qr_code_path column to cards table');
  } catch (error) {
    logger.error('Error in migration up:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove qr_code_path column from cards table
    await run(`
      ALTER TABLE cards
      DROP COLUMN qr_code_path
    `);
    logger.info('Removed qr_code_path column from cards table');
  } catch (error) {
    logger.error('Error in migration down:', error);
    throw error;
  }
}

module.exports = { up, down };
