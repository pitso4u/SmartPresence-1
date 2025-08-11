const { run, query } = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '8h' }
  );
};

// User login
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { username, password } = req.body;
    
    // Find user by username
    const rows = await query('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
    const user = rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid username or password' 
      });
    }

    // Update last login
    await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Remove sensitive data from response
    const { password_hash, ...userData } = user;
    
    // Set HTTP-only cookie with proper cross-origin settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      domain: process.env.NODE_ENV === 'production' ? '.yourschool.edu' : 'localhost',
      path: '/',
      sameSite: 'none',
      secure: true
    });
    
    res.status(200).json({ 
      status: 'success', 
      data: { ...userData, token } // For clients that can't use HTTP-only cookies
    });
  } catch (error) {
    logger.error('Error in loginUser:', error);
    next(error);
  }
};

// Get current authenticated user
const getCurrentUser = async (req, res, next) => {
  try {
    // User is set by the auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Not authenticated' 
      });
    }
    
    const { password_hash, ...userData } = req.user;
    res.status(200).json({ 
      status: 'success', 
      data: userData 
    });
  } catch (error) {
    logger.error('Error in getCurrentUser:', error);
    next(error);
  }
};

// User logout
const logoutUser = async (req, res, next) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('token');
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error('Error in logoutUser:', error);
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    // Only admins can list all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to access this resource' 
      });
    }
    
    const users = await query('SELECT id, client_uuid, username, email, full_name, role, is_active, last_login, created_at, updated_at FROM users');
    
    res.status(200).json({ 
      status: 'success', 
      data: users 
    });
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to access this resource' 
      });
    }
    
    const rows = await query(
      'SELECT id, client_uuid, username, email, full_name, role, is_active, last_login, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({ 
      status: 'success', 
      data: user 
    });
  } catch (error) {
    logger.error('Error in getUserById:', error);
    next(error);
  }
};

// Create a new user (admin only)
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    const { username, password, role, full_name, email } = req.body;
    
    // Only admins can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to create users' 
      });
    }
    
    // Check if username or email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username or email already in use' 
      });
    }
    
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const sql = `
      INSERT INTO users (
        client_uuid, 
        username, 
        password_hash, 
        role, 
        full_name, 
        email,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    
    const result = await run(sql, [
      uuidv4(),
      username,
      password_hash,
      role,
      full_name,
      email
    ]);
    
    // Get the newly created user (without password)
    const [newUser] = await query(
      'SELECT id, client_uuid, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    logger.error('Error in createUser:', error);
    next(error);
  }
};

// Update user by ID (admin or self)
const updateUserById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    const { username, email, full_name, role, is_active, current_password, new_password } = req.body;
    
    // Check if user exists
    const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    // Only admin or the user themselves can update
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to update this user' 
      });
    }
    
    // Regular users can only update their own name and password
    if (req.user.role !== 'admin' && (role || is_active !== undefined)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to update this field' 
      });
    }
    
    // Check if username or email already exists (excluding current user)
    const existingUser = await query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
      [username || user.username, email || user.email, id]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username or email already in use' 
      });
    }
    
    // Handle password change if requested
    let passwordUpdate = '';
    const params = [];
    
    if (new_password) {
      // Verify current password for non-admin users
      if (req.user.role !== 'admin' && !(await bcrypt.compare(current_password, user.password_hash))) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Current password is incorrect' 
        });
      }
      
      const password_hash = await bcrypt.hash(new_password, 10);
      passwordUpdate = ', password_hash = ?';
      params.push(password_hash);
    }
    
    // Build the update query
    const sql = `
      UPDATE users 
      SET 
        username = ?, 
        email = ?, 
        full_name = ?,
        role = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
        ${passwordUpdate}
      WHERE id = ?
    `;
    
    // Add parameters in the correct order
    params.unshift(
      username || user.username,
      email || user.email,
      full_name || user.full_name,
      role || user.role,
      is_active !== undefined ? is_active : user.is_active,
      id
    );
    
    await run(sql, params);
    
    // Get the updated user
    const [updatedUser] = await query(
      'SELECT id, client_uuid, username, email, full_name, role, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error in updateUserById:', error);
    next(error);
  }
};

// Delete user by ID (admin only)
const deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Not authorized to delete users' 
      });
    }
    
    // Prevent deleting yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }
    
    // Check if user exists
    const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const [result] = await query('SELECT COUNT(*) as count FROM users WHERE role = ? AND id != ?', ['admin', id]);
      if (result.count < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete the last admin user'
        });
      }
    }
    
    // Soft delete by setting is_active to false
    await run('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Error in deleteUserById:', error);
    next(error);
  }
};

// Change user password
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Get current password hash
    const [user] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    
    // Verify current password
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error in changePassword:', error);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  changePassword,
  // Add these:
  loginUser,
  getCurrentUser,
  logoutUser,
};
