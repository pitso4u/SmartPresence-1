const express = require('express');
const router = express.Router();

const studentRoutes = require('./studentRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const visitorRoutes = require('./visitorRoutes');
const incidentRoutes = require('./incidentRoutes');
const cardRoutes = require('./cardRoutes');
const settingsRoutes = require('./settingsRoutes');
const userRoutes = require('./userRoutes');
const photoRoutes = require('./photoRoutes');
const reportRoutes = require('./reportRoutes');
const systemRoutes = require('./systemRoutes');

// A simple test route to confirm the router is working
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Main API route is working.'
  });
});

router.use('/students', studentRoutes);
router.use('/students/', studentRoutes);
router.use('/employees', employeeRoutes);
router.use('/employees/', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/attendance/', attendanceRoutes);
router.use('/visitors', visitorRoutes);
router.use('/visitors/', visitorRoutes);
router.use('/incidents', incidentRoutes);
router.use('/incidents/', incidentRoutes);
router.use('/cards', cardRoutes);
router.use('/cards/', cardRoutes);
router.use('/settings', settingsRoutes);
router.use('/settings/', settingsRoutes);
router.use('/users', userRoutes);
router.use('/users/', userRoutes);
router.use('/photos', photoRoutes);
router.use('/photos/', photoRoutes);

// Reporting routes
router.use('/reports', reportRoutes);
router.use('/reports/', reportRoutes);

// System routes
router.use('/system', systemRoutes);
router.use('/system/', systemRoutes);

module.exports = router;
