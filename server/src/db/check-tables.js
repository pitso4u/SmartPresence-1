const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'tlaleho_ya_nako_server.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", [], (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err);
      return;
    }
    
    console.log('\nTables in database:');
    console.log('------------------');
    tables.forEach(table => {
      console.log(table.name);
    });
    
    // If settings table exists, show its structure
    if (tables.some(t => t.name === 'settings')) {
      console.log('\nSettings table structure:');
      console.log('------------------------');
      db.all("PRAGMA table_info(settings);", [], (err, columns) => {
        if (err) {
          console.error('Error getting table info:', err);
          return;
        }
        console.table(columns);
      });
    }
  });
});

db.close();
