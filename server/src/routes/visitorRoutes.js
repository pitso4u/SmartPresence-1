const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// Sync endpoint
router.post('/sync', visitorController.syncVisitors);

// Distinct data endpoints
router.get('/distinct/purposes', visitorController.getDistinctPurposes);
router.get('/distinct/hosts', visitorController.getDistinctHosts);

// CRUD endpoints
router.post('/', visitorController.createVisitor);
router.get('/', visitorController.getAllVisitors);
router.get('/:id', visitorController.getVisitorById);
router.put('/:id', visitorController.updateVisitorById);
router.put('/:id/checkout', visitorController.checkOutVisitor);
router.delete('/:id', visitorController.deleteVisitorById);

module.exports = router;
