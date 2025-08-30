const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./tlaleho_ya_nako_server.db');

console.log('Adding updated_at column to attendance_logs table...');

// Add updated_at column
db.run(`
  ALTER TABLE attendance_logs 
  ADD COLUMN updated_at TIMESTAMP
`, (err) => {
  if (err) {
    console.error('Error adding updated_at column:', err);
  } else {
    console.log('Successfully added updated_at column to attendance_logs table');
    
    // Update existing records to have updated_at = timestamp
    db.run(`
      UPDATE attendance_logs 
      SET updated_at = timestamp 
      WHERE updated_at IS NULL
    `, (updateErr) => {
      if (updateErr) {
        console.error('Error updating existing records:', updateErr);
      } else {
        console.log('Successfully updated existing records with updated_at values');
      }
      db.close();
    });
  }
});
