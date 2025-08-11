const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database files to inspect
const databases = [
    { name: 'test_tlalehoyaanako.db', path: '../test_tlalehoyaanako.db' },
    { name: 'tlaleho.db', path: '../data/tlaleho.db' },
    { name: 'tlaleho_ya_nako_server.db', path: './tlaleho_ya_nako_server.db' }
];

async function inspectDatabase(dbInfo) {
    return new Promise((resolve, reject) => {
        console.log(`\n=== Inspecting ${dbInfo.name} ===`);
        
        if (!fs.existsSync(dbInfo.path)) {
            console.log(`Database file ${dbInfo.path} does not exist.`);
            resolve();
            return;
        }

        const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error(`Error opening ${dbInfo.name}:`, err.message);
                resolve();
                return;
            }
        });

        // Get schema information
        db.all("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
            if (err) {
                console.error(`Error querying ${dbInfo.name}:`, err.message);
                db.close();
                resolve();
                return;
            }

            console.log(`Tables in ${dbInfo.name}:`);
            if (tables.length === 0) {
                console.log('  No tables found.');
            } else {
                tables.forEach(table => {
                    console.log(`  - ${table.name}`);
                });
                
                console.log(`\nTable schemas in ${dbInfo.name}:`);
                tables.forEach(table => {
                    console.log(`\n${table.name}:`);
                    console.log(table.sql);
                });
            }

            // Get row counts for each table
            console.log(`\nRow counts in ${dbInfo.name}:`);
            let completed = 0;
            if (tables.length === 0) {
                db.close();
                resolve();
                return;
            }

            tables.forEach(table => {
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                    if (err) {
                        console.log(`  ${table.name}: Error - ${err.message}`);
                    } else {
                        console.log(`  ${table.name}: ${row.count} rows`);
                    }
                    
                    completed++;
                    if (completed === tables.length) {
                        db.close();
                        resolve();
                    }
                });
            });
        });
    });
}

async function main() {
    console.log('Database Inspection Report');
    console.log('=========================');
    
    for (const dbInfo of databases) {
        await inspectDatabase(dbInfo);
    }
    
    console.log('\n=== Inspection Complete ===');
}

main().catch(console.error);
