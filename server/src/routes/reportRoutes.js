const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware to check if user has admin or manager role
const checkReportAccess = (req, res, next) => {
  // Allow admins and managers to access reports
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    return next();
  }
  res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
};

// Apply authentication and authorization middleware to all report routes
router.use(authenticate);
router.use(checkReportAccess);

// Attendance Reports
router.get('/attendance', reportController.getAttendanceReport);

// Student Reports
router.get('/students', reportController.getStudentReport);

// Employee Reports
router.get('/employees', reportController.getEmployeeReport);

// Visitor Reports
router.get('/visitors', reportController.getVisitorReport);

// Incident Reports
router.get('/incidents', reportController.getIncidentReport);

// ID Card Reports
router.get('/id-cards', reportController.getIdCardReport);

// Reports Summary for Dashboard
router.get('/summary', reportController.getReportsSummary);

module.exports = router;
