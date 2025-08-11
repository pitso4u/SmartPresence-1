const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateCreateUser,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateUserId
} = require('../middleware/validators/userValidators');

// Public routes (no authentication required)
router.post('/login', validateLogin, userController.loginUser);

// Protected routes (authentication required)
router.use(authenticate);

// User session management
router.post('/logout', userController.logoutUser);
router.get('/me', userController.getCurrentUser);
router.post('/change-password', validateChangePassword, userController.changePassword);

// User management (admin only)
router.use(authorize('admin'));

// CRUD endpoints
router.get('/', userController.getAllUsers);
router.get('/:id', validateUserId, userController.getUserById);
router.post('/', validateCreateUser, userController.createUser);
router.put('/:id', [...validateUserId, ...validateUpdateProfile], userController.updateUserById);
router.delete('/:id', validateUserId, userController.deleteUserById);

module.exports = router;
