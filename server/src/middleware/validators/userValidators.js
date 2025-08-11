const { body, param } = require('express-validator');
const { query } = require('../../db/config');

// Common validation rules
const usernameRules = (field = 'username') => 
  body(field)
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores');

const emailRules = (field = 'email') => 
  body(field)
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail();

const passwordRules = (field = 'password') => 
  body(field)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character');

const nameRules = (field, name) => 
  body(field)
    .trim()
    .notEmpty().withMessage(`${name} is required`)
    .isLength({ min: 2, max: 50 }).withMessage(`${name} must be between 2 and 50 characters`);

// Validation middleware for user registration
const validateCreateUser = [
  usernameRules(),
  emailRules(),
  passwordRules('password'),
  nameRules('full_name', 'Full name'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'staff']).withMessage('Invalid role')
];

// Validation middleware for user login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username or email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validation middleware for updating user profile
const validateUpdateProfile = [
  usernameRules().optional(),
  emailRules().optional(),
  nameRules('full_name', 'Full name').optional(),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'staff']).withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('Active status must be a boolean')
];

// Validation middleware for changing password
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation middleware for user ID in params
const validateUserId = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
    .toInt()
];

// Check if username is available
const checkUsernameAvailability = async (value, { req }) => {
  const [user] = await query('SELECT id FROM users WHERE username = ?', [value]);
  if (user && user.id !== req.params?.id) {
    throw new Error('Username is already in use');
  }
  return true;
};

// Check if email is available
const checkEmailAvailability = async (value, { req }) => {
  const [user] = await query('SELECT id FROM users WHERE email = ?', [value]);
  if (user && user.id !== req.params?.id) {
    throw new Error('Email is already in use');
  }
  return true;
};

module.exports = {
  validateCreateUser,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateUserId,
  checkUsernameAvailability,
  checkEmailAvailability
};
