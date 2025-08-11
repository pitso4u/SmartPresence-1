const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Sync endpoint
router.post('/sync', settingsController.syncSettings);

// System info endpoint
router.get('/system', settingsController.getSystemInfo);

// Settings CRUD endpoints
router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSettingByKey);
router.put('/:key', settingsController.updateSetting);
router.delete('/:key', settingsController.deleteSetting);

module.exports = router;
