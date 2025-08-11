const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Sync endpoint
router.post('/sync', incidentController.syncIncidents);

// Distinct data endpoints
router.get('/distinct/types', incidentController.getDistinctIncidentTypes);
router.get('/distinct/reporters', incidentController.getDistinctReporters);

// CRUD endpoints
router.post('/', incidentController.createIncident);
router.get('/', incidentController.getAllIncidents);
router.get('/:id', incidentController.getIncidentById);
router.put('/:id', incidentController.updateIncidentById);
router.delete('/:id', incidentController.deleteIncidentById);

module.exports = router;
