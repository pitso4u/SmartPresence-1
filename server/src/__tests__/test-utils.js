const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../db/config');
const { JWT_SECRET } = process.env;

/**
 * Creates a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user data
 */
async function createTestUser(userData = {}) {
  const email = userData.email || `test_${Date.now()}@example.com`;
  const password = userData.password || 'password123';
  const role = userData.role || 'admin';
  const fullName = userData.fullName || 'Test User';

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert user
  const [result] = await query(
    'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, role, fullName]
  );

  return {
    id: result.insertId,
    email,
    role,
    fullName,
  };
}

/**
 * Generates an auth token for a test user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<string>} JWT token
 */
async function getAuthToken(email, password) {
  // Find user by email
  const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    throw new Error('User not found');
  }
  
  const user = users[0];
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  // Generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return token;
}

/**
 * Cleans up test data from the database
 * @param {string} table - Table name
 * @param {string} condition - Condition for deletion
 * @param {Array} params - Query parameters
 * @returns {Promise<void>}
 */
async function cleanupTestData(table, condition, params) {
  await query(`DELETE FROM ${table} WHERE ${condition}`, params);
}

module.exports = {
  createTestUser,
  getAuthToken,
  cleanupTestData,
};
