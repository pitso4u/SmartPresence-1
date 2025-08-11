const { query } = require('./config');
const { logger } = require('../utils/logger');

async function checkCardsSchema() {
  try {
    // Check if the cards table exists
    const tableExists = await query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cards'"
    );

    if (tableExists.length === 0) {
      logger.warn('The cards table does not exist');
      return;
    }

    // Get the table structure
    const tableInfo = await query('PRAGMA table_info(cards)');
    console.log('\n=== Cards Table Structure ===');
    console.table(tableInfo);

    // Check if qr_code_path column exists
    const hasQrCodePath = tableInfo.some(column => column.name === 'qr_code_path');
    console.log(`\nColumn 'qr_code_path' exists: ${hasQrCodePath}`);

    // Log the full schema
    const schema = await query('SELECT sql FROM sqlite_master WHERE type="table" AND name="cards"');
    console.log('\n=== Cards Table Schema ===');
    console.log(schema[0]?.sql);

    // Get sample data from the table
    console.log('\n=== Sample Data (first 5 rows) ===');
    const sampleData = await query('SELECT * FROM cards LIMIT 5');
    console.table(sampleData);

    // Check for any data in qr_code_path if the column exists
    if (hasQrCodePath) {
      const qrCodeData = await query('SELECT id, user_id, user_type, qr_code_path FROM cards WHERE qr_code_path IS NOT NULL LIMIT 5');
      console.log('\n=== Sample QR Code Data ===');
      console.table(qrCodeData);
    }

  } catch (error) {
    console.error('Error checking cards table schema:', error);
  } finally {
    process.exit(0);
  }
}

checkCardsSchema();
