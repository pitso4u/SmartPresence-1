const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Sync endpoint
router.post('/sync', employeeController.syncEmployees);

// Distinct data endpoints
router.get('/distinct/job-titles', employeeController.getDistinctJobTitles);
router.get('/distinct/departments', employeeController.getDistinctDepartments);

// Validation endpoints
router.get('/exists/:employeeId', employeeController.employeeIdExists);

// CRUD endpoints
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployeeById);
router.delete('/:id', employeeController.deleteEmployeeById);
router.post('/', employeeController.createEmployee);

module.exports = router;
