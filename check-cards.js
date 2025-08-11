import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const dbPath = join(__dirname, 'server', 'tlaleho_ya_nako_server.db');
console.log('Checking database at:', dbPath);

const db = new (sqlite3.verbose().Database)(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Promisify database methods
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

async function checkDatabase() {
  try {
    // Check if cards table exists
    const tableExists = await dbGet(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cards'"
    );

    if (!tableExists) {
      console.log('Cards table does not exist in the database.');
      db.close();
      return;
    }

    console.log('Cards table exists. Checking for card entries...');

    // Count total cards
    const countResult = await dbGet('SELECT COUNT(*) as count FROM cards');
    console.log(`Total cards in database: ${countResult.count}`);

    // Show card count by type
    const typeCounts = await dbAll(
      'SELECT user_type, COUNT(*) as count FROM cards GROUP BY user_type'
    );
    
    console.log('\nCard counts by type:');
    console.table(typeCounts);

    // Show schema of cards table
    const columns = await dbAll('PRAGMA table_info(cards)');
    console.log('\nCards table schema:');
    console.table(columns);

    // Show a few sample cards if they exist
    if (countResult.count > 0) {
      const sampleCards = await dbAll('SELECT * FROM cards LIMIT 5');
      console.log('\nSample cards:');
      console.table(sampleCards);
    }

  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the check
checkDatabase().catch(console.error);
