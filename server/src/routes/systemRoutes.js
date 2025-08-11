const express = require('express');
const router = express.Router();
const { getSystemStatus } = require('../controllers/systemController');
const { authenticate, authorize } = require('../middleware/auth');

// System status endpoint - requires authentication
router.get('/status', authenticate, getSystemStatus);

module.exports = router;
