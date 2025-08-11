const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Log attendance
router.post('/', attendanceController.logAttendance);

// Get attendance logs with filters
router.get('/', attendanceController.getAttendanceLogs);

// Get attendance summary (counts by status)
router.get('/summary', attendanceController.getAttendanceSummary);

// Get attendance for a specific user
router.get('/user/:user_type/:user_id', attendanceController.getUserAttendance);

// Update attendance record (admin only)
router.put('/:id', attendanceController.updateAttendance);

// Delete attendance record (admin only)
router.delete('/:id', attendanceController.deleteAttendance);

// Sync attendance records (for offline support)
router.post('/sync', attendanceController.syncAttendance);

// Check for unsynced records
router.get('/unsynced', attendanceController.checkUnsynced);

// Manual sync trigger
router.post('/manual-sync', async (req, res) => {
  try {
    // Check for unsynced records
    const { count, records } = await attendanceController.checkUnsynced(req, res);
    
    if (count > 0) {
      // Process the sync queue
      await attendanceController.syncAttendance({ body: records }, res);
    } else {
      res.json({ message: 'No unsynced records found', count: 0 });
    }
  } catch (error) {
    console.error('Error in manual sync:', error);
    res.status(500).json({ error: 'Manual sync failed', details: error.message });
  }
});

module.exports = router;
