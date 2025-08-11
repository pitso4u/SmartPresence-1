const { query } = require('../db/config');
const { logger } = require('../utils/logger');

/**
 * Get attendance report with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAttendanceReport = async (req, res) => {
  const { start_date, end_date, user_type, status, group_by = 'day' } = req.query;
  
  try {
    // Base query for attendance data
    let sql = `
      SELECT 
        DATE(timestamp) as date,
        user_type,
        status,
        COUNT(*) as count
      FROM attendance_logs
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add filters
    if (start_date) {
      sql += ' AND timestamp >= ?';
      params.push(new Date(start_date).toISOString());
    }
    
    if (end_date) {
      sql += ' AND timestamp <= ?';
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      params.push(endDateObj.toISOString());
    }
    
    if (user_type) {
      sql += ' AND user_type = ?';
      params.push(user_type);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    // Group by clause based on grouping preference
    const groupByClause = group_by === 'day' 
      ? 'DATE(timestamp), user_type, status'
      : `DATE_FORMAT(timestamp, '%Y-%m') as month, user_type, status`;
    
    sql += ` GROUP BY ${groupByClause} ORDER BY date DESC`;
    
    const results = await query(sql, params);
    
    // Format the results for the frontend
    const formattedResults = results.map(row => ({
      date: row.date || row.month,
      userType: row.user_type,
      status: row.status,
      count: parseInt(row.count)
    }));
    
    res.json(formattedResults);
    
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
};

/**
 * Get student report with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentReport = async (req, res) => {
  const { grade, classroom, status } = req.query;
  
  try {
    let sql = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = s.id AND al.user_type = 'student' AND al.status = 'present') as present_count,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = s.id AND al.user_type = 'student' AND al.status = 'late') as late_count,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = s.id AND al.user_type = 'student' AND al.status = 'absent') as absent_count
      FROM students s
      WHERE 1=1
    `;
    
    const params = [];
    
    if (grade) {
      sql += ' AND s.grade = ?';
      params.push(grade);
    }
    
    if (classroom) {
      sql += ' AND s.classroom = ?';
      params.push(classroom);
    }
    
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    
    const students = await query(sql, params);
    
    // Calculate attendance statistics
    const report = students.map(student => ({
      id: student.id,
      fullName: student.full_name,
      grade: student.grade,
      classroom: student.classroom,
      presentCount: student.present_count || 0,
      lateCount: student.late_count || 0,
      absentCount: student.absent_count || 0,
      totalRecords: (student.present_count || 0) + (student.late_count || 0) + (student.absent_count || 0),
      attendanceRate: calculateAttendanceRate(student)
    }));
    
    res.json(report);
    
  } catch (error) {
    logger.error('Error generating student report:', error);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

/**
 * Get employee report with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeReport = async (req, res) => {
  const { department, position, status } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = e.id AND al.user_type = 'employee' AND al.status = 'present') as present_count,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = e.id AND al.user_type = 'employee' AND al.status = 'late') as late_count,
        (SELECT COUNT(*) FROM attendance_logs al 
         WHERE al.user_id = e.id AND al.user_type = 'employee' AND al.status = 'absent') as absent_count
      FROM employees e
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department) {
      sql += ' AND e.department = ?';
      params.push(department);
    }
    
    if (position) {
      sql += ' AND e.position = ?';
      params.push(position);
    }
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    
    const employees = await query(sql, params);
    
    // Calculate attendance statistics
    const report = employees.map(employee => ({
      id: employee.id,
      fullName: employee.full_name,
      department: employee.department,
      position: employee.position,
      presentCount: employee.present_count || 0,
      lateCount: employee.late_count || 0,
      absentCount: employee.absent_count || 0,
      totalRecords: (employee.present_count || 0) + (employee.late_count || 0) + (employee.absent_count || 0),
      attendanceRate: calculateAttendanceRate(employee)
    }));
    
    res.json(report);
    
  } catch (error) {
    logger.error('Error generating employee report:', error);
    res.status(500).json({ error: 'Failed to generate employee report' });
  }
};

/**
 * Get visitor report with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVisitorReport = async (req, res) => {
  const { start_date, end_date, purpose } = req.query;
  
  try {
    let sql = `
      SELECT 
        v.*,
        e.full_name as employee_name,
        e.department as employee_department
      FROM visitors v
      LEFT JOIN employees e ON v.employee_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (start_date) {
      sql += ' AND v.visit_date >= ?';
      params.push(new Date(start_date).toISOString().split('T')[0]);
    }
    
    if (end_date) {
      sql += ' AND v.visit_date <= ?';
      params.push(new Date(end_date).toISOString().split('T')[0]);
    }
    
    if (purpose) {
      sql += ' AND v.purpose LIKE ?';
      params.push(`%${purpose}%`);
    }
    
    sql += ' ORDER BY v.visit_date DESC, v.check_in_time DESC';
    
    const visitors = await query(sql, params);
    
    res.json(visitors);
    
  } catch (error) {
    logger.error('Error generating visitor report:', error);
    res.status(500).json({ error: 'Failed to generate visitor report' });
  }
};

/**
 * Get incident report with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getIncidentReport = async (req, res) => {
  const { start_date, end_date, severity, status, reported_by } = req.query;
  
  try {
    let sql = `
      SELECT 
        i.*,
        r.full_name as reporter_name,
        r.role as reporter_role
      FROM incidents i
      LEFT JOIN users r ON i.reported_by = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (start_date) {
      sql += ' AND i.incident_date >= ?';
      params.push(new Date(start_date).toISOString().split('T')[0]);
    }
    
    if (end_date) {
      sql += ' AND i.incident_date <= ?';
      params.push(new Date(end_date).toISOString().split('T')[0]);
    }
    
    if (severity) {
      sql += ' AND i.severity = ?';
      params.push(severity);
    }
    
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }
    
    if (reported_by) {
      sql += ' AND i.reported_by = ?';
      params.push(reported_by);
    }
    
    sql += ' ORDER BY i.incident_date DESC, i.created_at DESC';
    
    const incidents = await query(sql, params);
    
    res.json(incidents);
    
  } catch (error) {
    logger.error('Error generating incident report:', error);
    res.status(500).json({ error: 'Failed to generate incident report' });
  }
};

/**
 * Get ID card status report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getIdCardReport = async (req, res) => {
  const { status, user_type } = req.query;
  
  try {
    let sql = `
      SELECT 
        c.*,
        u.full_name,
        u.user_type
      FROM id_cards c
      JOIN (
        SELECT id, full_name, 'student' as user_type FROM students
        UNION ALL
        SELECT id, full_name, 'employee' as user_type FROM employees
      ) u ON c.user_id = u.id AND c.user_type = u.user_type
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    
    if (user_type) {
      sql += ' AND c.user_type = ?';
      params.push(user_type);
    }
    
    sql += ' ORDER BY c.updated_at DESC';
    
    const cards = await query(sql, params);
    
    res.json(cards);
    
  } catch (error) {
    logger.error('Error generating ID card report:', error);
    res.status(500).json({ error: 'Failed to generate ID card report' });
  }
};

/**
 * Helper function to calculate attendance rate
 * @param {Object} user - User object with attendance counts
 * @returns {number} - Attendance rate as a percentage (0-100)
 */
const calculateAttendanceRate = (user) => {
  const total = (user.present_count || 0) + (user.late_count || 0) + (user.absent_count || 0);
  if (total === 0) return 0;
  
  const presentAndLate = (user.present_count || 0) + (user.late_count || 0);
  return Math.round((presentAndLate / total) * 100);
};

/**
 * Get summary of all reports for dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReportsSummary = async (req, res) => {
  try {
    // Get total counts for each report type
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
      // Get table info to check which tables/columns exist
      const tableResults = await query("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = Array.isArray(tableResults) 
        ? tableResults.map(t => t.name) 
        : [];
      
      // Get column info for visitors table if it exists
      let visitorDateColumn = 'created_at';
      if (tableNames.includes('visitors')) {
        try {
          const columns = await query('PRAGMA table_info(visitors)');
          const columnNames = Array.isArray(columns) 
            ? columns.map(c => c.name) 
            : [];
            
          if (!columnNames.includes('created_at') && columnNames.includes('date_created')) {
            visitorDateColumn = 'date_created';
          }
        } catch (e) {
          console.log('Could not check visitors table columns:', e.message);
        }
      }
      
      // Run queries in parallel
      const queries = [
        // Count today's attendance logs (if table exists)
        tableNames.includes('attendance_logs') 
          ? query(`SELECT COUNT(*) as total FROM attendance_logs WHERE date(timestamp) = ?`, [today])
          : Promise.resolve([{ total: 0 }]),
          
        // Count all students (if table exists)
        tableNames.includes('students')
          ? query('SELECT COUNT(DISTINCT id) as total FROM students')
          : Promise.resolve([{ total: 0 }]),
          
        // Count all employees (if table exists)
        tableNames.includes('employees')
          ? query('SELECT COUNT(DISTINCT id) as total FROM employees')
          : Promise.resolve([{ total: 0 }]),
          
        // Count today's visitors (if table exists and has the date column)
        (tableNames.includes('visitors') && visitorDateColumn)
          ? (async () => {
              try {
                // First verify the column exists to avoid SQL errors
                const columns = await query(`PRAGMA table_info('visitors')`);
                const columnCheck = columns.some(col => col.name === visitorDateColumn);
                if (columnCheck) {
                  const result = await query(
                    `SELECT COUNT(*) as total FROM visitors WHERE date(${visitorDateColumn}) = ?`, 
                    [today]
                  );
                  return result[0] || { total: 0 };
                }
                return { total: 0 };
              } catch (e) {
                console.error('Error counting visitors:', e.message);
                return { total: 0 };
              }
            })()
          : Promise.resolve({ total: 0 }),
          
        // Count all incidents (if table exists)
        tableNames.includes('incidents')
          ? query('SELECT COUNT(*) as total FROM incidents')
          : Promise.resolve([{ total: 0 }])
      ];
      
      const results = await Promise.all(queries);
      
      // Extract counts from query results
      const attendanceCount = results[0]?.[0]?.total || 0;
      const studentCount = results[1]?.[0]?.total || 0;
      const employeeCount = results[2]?.[0]?.total || 0;
      const visitorCount = results[3]?.total || 0; // visitorCount is already an object with total
      const incidentCount = results[4]?.[0]?.total || 0;

    // Get recent reports
    let recentReports = [];
    
    // Only try to get recent reports if the tables exist
    if (tableNames.includes('attendance_logs') || tableNames.includes('incidents')) {
      try {
        // Get recent attendance logs if table exists
        let attendanceLogs = [];
        if (tableNames.includes('attendance_logs')) {
          try {
            attendanceLogs = await query(`
              SELECT 
                id, 
                'attendance' as type,
                'Attendance - ' || date(timestamp) as title,
                timestamp as created_at
              FROM attendance_logs 
              ORDER BY timestamp DESC 
              LIMIT 5
            `);
          } catch (e) {
            console.error('Error fetching attendance logs:', e.message);
          }
        }
        
        // Get recent incidents if table exists
        let incidents = [];
        if (tableNames.includes('incidents')) {
          try {
            incidents = await query(`
              SELECT 
                id, 
                'incident' as type,
                'Incident - ' || COALESCE(incident_type, 'Reported') as title,
                COALESCE(reported_at, datetime('now')) as created_at,
                description
              FROM incidents 
              ORDER BY reported_at DESC 
              LIMIT 5
            `);
          } catch (e) {
            console.error('Error fetching incidents:', e.message);
          }
        }
        
        // Combine and sort results in memory
        recentReports = [...(attendanceLogs || []), ...(incidents || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
      } catch (e) {
        console.error('Error fetching recent reports:', e);
        // Continue with empty recent reports if there's an error
      }
    }

      // Format the response
      const summary = {
        total: {
          attendance: parseInt(attendanceCount) || 0,
          students: parseInt(studentCount) || 0,
          employees: parseInt(employeeCount) || 0,
          visitors: parseInt(visitorCount) || 0,
          openIncidents: parseInt(incidentCount) || 0
        },
        recent: Array.isArray(recentReports) 
          ? recentReports.map(report => ({
              id: report.id,
              type: report.type,
              title: report.title || 'Untitled',
              date: report.created_at || new Date().toISOString()
            }))
          : [],
        byStatus: {
          active: (parseInt(studentCount) || 0) + (parseInt(employeeCount) || 0),
          visitors: parseInt(visitorCount) || 0,
          openIncidents: parseInt(incidentCount) || 0
        },
        byType: {
          attendance: parseInt(attendanceCount) || 0,
          students: parseInt(studentCount) || 0,
          employees: parseInt(employeeCount) || 0,
          visitors: parseInt(visitorCount) || 0
        }
      };

      res.json(summary);
    } catch (e) {
      console.error('Error in getReportsSummary:', e);
      // Return a default response with all zeros if there's an error
      res.json({
        total: { attendance: 0, students: 0, employees: 0, visitors: 0, openIncidents: 0 },
        recent: [],
        byStatus: { active: 0, visitors: 0, openIncidents: 0 },
        byType: { attendance: 0, students: 0, employees: 0, visitors: 0 }
      });
    }
  } catch (error) {
    logger.error('Error in reports summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAttendanceReport,
  getStudentReport,
  getEmployeeReport,
  getVisitorReport,
  getIncidentReport,
  getIdCardReport,
  getReportsSummary
};
