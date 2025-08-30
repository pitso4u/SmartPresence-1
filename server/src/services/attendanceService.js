const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

/**
 * Attendance Service - Handles attendance logic with daily initialization
 */
class AttendanceService {
  /**
   * Get attendance settings from the database
   */
  async getAttendanceSettings() {
    try {
      // First try to get settings from the flat structure (newer format)
      let settings = await query('SELECT attendance_start_time, attendance_end_time, late_threshold_minutes FROM settings LIMIT 1');
      
      if (settings.length === 0) {
        // Try key-value structure (older format)
        const keyValueSettings = await query('SELECT key, value FROM settings WHERE key IN (?, ?, ?)', [
          'attendance_start_time',
          'attendance_end_time', 
          'late_threshold_minutes'
        ]);
        
        if (keyValueSettings.length > 0) {
          // Convert key-value to flat structure
          const flatSettings = {};
          keyValueSettings.forEach(setting => {
            flatSettings[setting.key] = setting.value;
          });
          
          return {
            attendance_start_time: flatSettings.attendance_start_time || '08:00',
            attendance_end_time: flatSettings.attendance_end_time || '16:00',
            late_threshold_minutes: parseInt(flatSettings.late_threshold_minutes) || 15
          };
        }
      } else {
        // Return the flat structure settings
        return {
          attendance_start_time: settings[0].attendance_start_time || '08:00',
          attendance_end_time: settings[0].attendance_end_time || '16:00',
          late_threshold_minutes: parseInt(settings[0].late_threshold_minutes) || 15
        };
      }
      
      // Return default settings if no settings found
      return {
        attendance_start_time: '08:00',
        attendance_end_time: '16:00',
        late_threshold_minutes: 15
      };
    } catch (error) {
      logger.error('Error fetching attendance settings:', error);
      // Return default settings on error
      return {
        attendance_start_time: '08:00',
        attendance_end_time: '16:00',
        late_threshold_minutes: 15
      };
    }
  }

  /**
   * Check if this is the first attendance scan of the day
   */
  async isFirstScanOfDay() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const existingRecords = await query(
        'SELECT COUNT(*) as count FROM attendance_logs WHERE timestamp BETWEEN ? AND ?',
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      return existingRecords[0].count === 0;
    } catch (error) {
      logger.error('Error checking first scan of day:', error);
      return false;
    }
  }

  /**
   * Initialize daily attendance records for all expected people
   */
  async initializeDailyAttendance() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get all students and employees (no is_active filter since column doesn't exist)
      const students = await query('SELECT id FROM students');
      const employees = await query('SELECT id FROM employees');

      const records = [];
      const clientUuids = [];

      // Create absent records for all students
      for (const student of students) {
        const clientUuid = require('uuid').v4();
        records.push([
          clientUuid,
          student.id,
          'student',
          startOfDay.toISOString(),
          'absent',
          'system',
          null,
          1
        ]);
        clientUuids.push(clientUuid);
      }

      // Create absent records for all employees
      for (const employee of employees) {
        const clientUuid = require('uuid').v4();
        records.push([
          clientUuid,
          employee.id,
          'employee',
          startOfDay.toISOString(),
          'absent',
          'system',
          null,
          1
        ]);
        clientUuids.push(clientUuid);
      }

      if (records.length > 0) {
        // Insert all records in a single transaction
        await run('BEGIN TRANSACTION');
        
        try {
          for (const record of records) {
            await run(
              `INSERT INTO attendance_logs 
               (client_uuid, user_id, user_type, timestamp, status, method, match_confidence, synced)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              record
            );
          }
          
          await run('COMMIT');
          logger.info(`Initialized daily attendance for ${records.length} people`);
        } catch (error) {
          await run('ROLLBACK');
          throw error;
        }
      }

      return records.length;
    } catch (error) {
      logger.error('Error initializing daily attendance:', error);
      throw error;
    }
  }

  /**
   * Determine attendance status based on time and settings
   */
  determineAttendanceStatus(timestamp, settings) {
    const time = new Date(timestamp);
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = (hours * 60) + minutes;

    // Parse settings
    const startTimeParts = settings.attendance_start_time.split(':');
    const startTimeMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
    
    const endTimeParts = settings.attendance_end_time.split(':');
    const endTimeMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
    
    const lateThreshold = startTimeMinutes + settings.late_threshold_minutes;

    logger.info(`Attendance status calculation:`, {
      timestamp,
      time: time.toISOString(),
      hours,
      minutes,
      totalMinutes,
      startTime: settings.attendance_start_time,
      startTimeMinutes,
      endTime: settings.attendance_end_time,
      endTimeMinutes,
      lateThreshold,
      lateThresholdMinutes: settings.late_threshold_minutes
    });

    // Check if within attendance hours
    if (totalMinutes < startTimeMinutes || totalMinutes > endTimeMinutes) {
      logger.info(`Status: absent (outside attendance hours)`);
      return 'absent';
    }

    // Check if on time or late
    if (totalMinutes <= lateThreshold) {
      logger.info(`Status: present (on time)`);
      return 'present';
    } else {
      logger.info(`Status: late (after threshold)`);
      return 'late';
    }
  }

  /**
   * Update existing attendance record for a user on the same day
   */
  async updateExistingAttendance(userId, userType, timestamp, status, method, matchConfidence = null) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      // Find existing record for today
      const existingRecord = await query(
        'SELECT id, status FROM attendance_logs WHERE user_id = ? AND user_type = ? AND timestamp BETWEEN ? AND ?',
        [userId, userType, startOfDay.toISOString(), endOfDay.toISOString()]
      );

      if (existingRecord.length > 0) {
        const record = existingRecord[0];
        
        // Only update if the new status is better than the current status
        // absent -> present/late is an improvement
        // present -> late is not an improvement
        const statusHierarchy = { 'absent': 0, 'late': 1, 'present': 2 };
        const currentStatusValue = statusHierarchy[record.status] || 0;
        const newStatusValue = statusHierarchy[status] || 0;
        
        if (newStatusValue > currentStatusValue) {
          // Update the existing record with better status
          await run(
            'UPDATE attendance_logs SET timestamp = ?, status = ?, method = ?, match_confidence = ? WHERE id = ?',
            [timestamp, status, method, matchConfidence, record.id]
          );

          logger.info(`Updated attendance record for user ${userId} (${userType}) from ${record.status} to ${status}`);
          return record.id;
        } else {
          // Status is not better, just update timestamp and method
          await run(
            'UPDATE attendance_logs SET timestamp = ?, method = ?, match_confidence = ? WHERE id = ?',
            [timestamp, method, matchConfidence, record.id]
          );

          logger.info(`Updated timestamp for user ${userId} (${userType}) - status remains ${record.status}`);
          return record.id;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error updating existing attendance:', error);
      throw error;
    }
  }

  /**
   * Process attendance scan/swipe
   */
  async processAttendance(userId, userType, timestamp, method, matchConfidence = null) {
    try {
      // Get attendance settings
      const settings = await this.getAttendanceSettings();
      logger.info(`Processing attendance for user ${userId} (${userType}) at ${timestamp}`);
      logger.info(`Attendance settings:`, settings);
      
      // Determine status based on time
      const status = this.determineAttendanceStatus(timestamp, settings);
      logger.info(`Determined status: ${status} for timestamp ${timestamp}`);
      
      // Check if this is the first scan of the day
      const isFirstScan = await this.isFirstScanOfDay();
      logger.info(`Is first scan of day: ${isFirstScan}`);
      
      if (isFirstScan) {
        // Initialize daily attendance for all people
        await this.initializeDailyAttendance();
      }

      // Try to update existing record first
      const updatedRecordId = await this.updateExistingAttendance(
        userId, userType, timestamp, status, method, matchConfidence
      );

      if (updatedRecordId) {
        // Return the updated record
        const updatedRecord = await query(
          'SELECT * FROM attendance_logs WHERE id = ?',
          [updatedRecordId]
        );
        logger.info(`Updated attendance record:`, updatedRecord[0]);
        return updatedRecord[0];
      } else {
        // Create new record if no existing record found (shouldn't happen after initialization)
        const clientUuid = require('uuid').v4();
        const result = await run(
          `INSERT INTO attendance_logs 
           (client_uuid, user_id, user_type, timestamp, status, method, match_confidence, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [clientUuid, userId, userType, timestamp, status, method, matchConfidence, 1]
        );

        const newRecord = await query(
          'SELECT * FROM attendance_logs WHERE id = ?',
          [result.lastID]
        );

        logger.info(`Created new attendance record for user ${userId} (${userType}) with status ${status}`);
        return newRecord[0];
      }
    } catch (error) {
      logger.error('Error processing attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a specific date
   */
  async getAttendanceSummary(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const summary = await query(
        `SELECT 
          status,
          user_type,
          COUNT(*) as count
         FROM attendance_logs 
         WHERE timestamp BETWEEN ? AND ?
         GROUP BY status, user_type`,
        [startOfDay.toISOString(), endOfDay.toISOString()]
      );

      return summary;
    } catch (error) {
      logger.error('Error getting attendance summary:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceService();
