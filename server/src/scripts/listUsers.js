const { query } = require('../db/config');
const { logger } = require('../utils/logger');

async function listUsers() {
  try {
    const users = await query('SELECT id, username, email, role, is_active, created_at FROM users');
    console.log('Users in the database:');
    console.table(users);
  } catch (error) {
    logger.error('Error listing users:', error);
    console.error('Error listing users:', error.message);
  } finally {
    process.exit(0);
  }
}

listUsers();
