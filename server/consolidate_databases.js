const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Source databases to consolidate
const sourceDatabases = [
    { name: 'test_tlalehoyaanako.db', path: '../test_tlalehoyaanako.db' },
    { name: 'tlaleho.db', path: '../data/tlaleho.db' }
];

// Target database (main server database)
const targetDb = './tlaleho_ya_nako_server.db';
const consolidatedDb = '../tlalehoyaanako.db'; // New unified database name

async function consolidateDatabases() {
    console.log('=== Database Consolidation Process ===\n');

    // Step 1: Copy the main server database as the base
    console.log('Step 1: Creating unified database from server database...');
    try {
        fs.copyFileSync(targetDb, consolidatedDb);
        console.log(`✅ Copied ${targetDb} to ${consolidatedDb}`);
    } catch (error) {
        console.error(`❌ Error copying database: ${error.message}`);
        return;
    }

    // Step 2: Open the consolidated database
    const consolidatedDatabase = new sqlite3.Database(consolidatedDb, (err) => {
        if (err) {
            console.error('❌ Error opening consolidated database:', err.message);
            return;
        }
        console.log('✅ Opened consolidated database successfully');
    });

    // Step 3: Process each source database
    for (const sourceDb of sourceDatabases) {
        if (!fs.existsSync(sourceDb.path)) {
            console.log(`⚠️  Source database ${sourceDb.name} not found, skipping...`);
            continue;
        }

        console.log(`\nStep 3: Processing ${sourceDb.name}...`);
        await processSourceDatabase(sourceDb, consolidatedDatabase);
    }

    // Step 4: Verify the consolidated database
    console.log('\nStep 4: Verifying consolidated database...');
    await verifyConsolidatedDatabase(consolidatedDatabase);

    // Step 5: Close database connection
    consolidatedDatabase.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database consolidation completed successfully!');
            console.log(`\n📍 Unified database location: ${path.resolve(consolidatedDb)}`);
            console.log('\nNext steps:');
            console.log('1. Update JavaFX DatabaseHelper to use the new unified database');
            console.log('2. Update server config to use the new unified database');
            console.log('3. Test both applications with the unified database');
            console.log('4. Remove old database files after verification');
        }
    });
}

async function processSourceDatabase(sourceDb, targetDatabase) {
    return new Promise((resolve, reject) => {
        const sourceDatabase = new sqlite3.Database(sourceDb.path, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error(`❌ Error opening ${sourceDb.name}:`, err.message);
                resolve();
                return;
            }
        });

        // Get all tables from source database
        sourceDatabase.all("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'", (err, tables) => {
            if (err) {
                console.error(`❌ Error querying tables in ${sourceDb.name}:`, err.message);
                sourceDatabase.close();
                resolve();
                return;
            }

            if (tables.length === 0) {
                console.log(`  No tables found in ${sourceDb.name}`);
                sourceDatabase.close();
                resolve();
                return;
            }

            console.log(`  Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);

            // Process each table
            let processedTables = 0;
            tables.forEach(table => {
                // Check if data exists in this table
                sourceDatabase.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                    if (err) {
                        console.log(`  ⚠️  Error counting rows in ${table.name}: ${err.message}`);
                    } else if (row.count > 0) {
                        console.log(`  📊 ${table.name}: ${row.count} rows (data exists but will use server version)`);
                    } else {
                        console.log(`  📊 ${table.name}: 0 rows (empty)`);
                    }

                    processedTables++;
                    if (processedTables === tables.length) {
                        sourceDatabase.close();
                        resolve();
                    }
                });
            });
        });
    });
}

async function verifyConsolidatedDatabase(database) {
    return new Promise((resolve, reject) => {
        database.all("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name", (err, tables) => {
            if (err) {
                console.error('❌ Error verifying consolidated database:', err.message);
                resolve();
                return;
            }

            console.log(`✅ Consolidated database contains ${tables.length} tables:`);
            
            let processedTables = 0;
            tables.forEach(table => {
                database.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                    if (err) {
                        console.log(`  ❌ ${table.name}: Error - ${err.message}`);
                    } else {
                        console.log(`  ✅ ${table.name}: ${row.count} rows`);
                    }
                    
                    processedTables++;
                    if (processedTables === tables.length) {
                        resolve();
                    }
                });
            });
        });
    });
}

// Run the consolidation
consolidateDatabases().catch(console.error);
