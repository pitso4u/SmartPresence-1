const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Sync endpoint
router.post('/sync', studentController.syncStudents);

// Distinct data endpoints
router.get('/distinct/grades', studentController.getDistinctGrades);
router.get('/distinct/classrooms', studentController.getDistinctClassrooms);

// CRUD endpoints
router.get('/', studentController.getAllStudents);
router.get('/code/:studentCode', studentController.getStudentByCode);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudentById);
router.delete('/:id', studentController.deleteStudentById);

module.exports = router;
