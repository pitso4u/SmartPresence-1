const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

const syncEmployees = async (req, res, next) => {
  try {
    const employees = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body must be a non-empty array of employees.',
      });
    }

    logger.info(`Received request to sync ${employees.length} employees.`);

    // First, try to add role column if it doesn't exist (for backward compatibility)
    try {
      await run('ALTER TABLE employees ADD COLUMN role TEXT DEFAULT "OTHER"');
      logger.info('Added role column to employees table during sync');
    } catch (alterError) {
      // Column might already exist, ignore error
      if (!alterError.message.includes('duplicate column name')) {
        logger.debug('Role column might already exist during sync:', alterError.message);
      }
    }

    const promises = employees.map(employee => {
      const sql = `
        INSERT INTO employees (client_uuid, full_name, employee_id, id_number, job_title, department, contact_number, email, photo_path, face_vector, role, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(client_uuid) DO UPDATE SET
          full_name = excluded.full_name,
          employee_id = excluded.employee_id,
          id_number = excluded.id_number,
          job_title = excluded.job_title,
          department = excluded.department,
          contact_number = excluded.contact_number,
          email = excluded.email,
          photo_path = excluded.photo_path,
          face_vector = excluded.face_vector,
          role = excluded.role,
          synced = 1;
      `;
      
      const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
      const faceVectorBuffer = employee.faceVector ? Buffer.from(employee.faceVector, 'base64') : null;
      
      // Convert JavaFX UserRole enum to string, default to 'OTHER'
      let role = 'OTHER';
      if (employee.role) {
        if (typeof employee.role === 'string') {
          role = employee.role.toUpperCase();
        } else if (employee.role.toString) {
          role = employee.role.toString().toUpperCase();
        }
      }

      const params = [
        employee.id,
        fullName,
        employee.employeeId,
        employee.idNumber,
        employee.jobTitle,
        employee.department,
        employee.contactNumber,
        employee.email,
        employee.photoPath,
        faceVectorBuffer,
        role,
      ];
      
      return run(sql, params);
    });

    await Promise.all(promises);

    logger.info(`Successfully synced ${employees.length} employees.`);
    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${employees.length} employees.`,
      data: { receivedCount: employees.length },
    });
  } catch (error) {
    logger.error('Error in syncEmployees:', error);
    next(error);
  }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await query('SELECT * FROM employees');
    
    // Parse full_name into firstName and lastName for JavaFX compatibility
    const employeesWithNames = employees.map(employee => {
      const fullName = employee.full_name || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Map database role to JavaFX UserRole enum values
      let role = 'OTHER'; // Default role
      if (employee.role) {
        // If role field exists in database, use it
        role = employee.role.toUpperCase();
      } else {
        // Fallback: try to infer role from job title or department
        const jobTitle = (employee.job_title || '').toLowerCase();
        const department = (employee.department || '').toLowerCase();
        
        if (jobTitle.includes('teacher') || jobTitle.includes('instructor') || jobTitle.includes('educator')) {
          role = 'TEACHER';
        } else if (jobTitle.includes('admin') || jobTitle.includes('administrator') || department.includes('admin')) {
          role = 'ADMIN';
        } else if (jobTitle.includes('manager') || jobTitle.includes('director') || jobTitle.includes('head') || department.includes('management')) {
          role = 'MANAGEMENT';
        } else if (jobTitle.includes('support') || jobTitle.includes('assistant') || jobTitle.includes('clerk')) {
          role = 'SUPPORT_STAFF';
        }
      }
      
      return {
        ...employee,
        firstName: firstName,
        lastName: lastName,
        jobTitle: employee.job_title || '',     // Map job_title to jobTitle for JavaFX
        department: employee.department || '',   // Keep department as department
        role: role                              // Proper role mapping for JavaFX UserRole enum
      };
    });
    
    // Debug logging to verify parsing
    console.log('DEBUG: getAllEmployees response sample:', JSON.stringify(employeesWithNames[0], null, 2));
    
    res.status(200).json({ status: 'success', data: employeesWithNames });
  } catch (error) {
    logger.error('Error in getAllEmployees:', error);
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM employees WHERE id = ?', [id]);
    const employee = rows[0];
    if (!employee) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }
    res.status(200).json({ status: 'success', data: employee });
  } catch (error) {
    logger.error('Error in getEmployeeById:', error);
    next(error);
  }
};

const updateEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, employee_id, id_number, job_title, department, photo_path } = req.body;

    const sql = `
      UPDATE employees SET
        full_name = ?,
        employee_id = ?,
        id_number = ?,
        job_title = ?,
        department = ?,
        photo_path = ?
      WHERE id = ?;
    `;

    const result = await run(sql, [full_name, employee_id, id_number, job_title, department, photo_path, id]);

    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found or no changes made' });
    }

    res.status(200).json({ status: 'success', message: 'Employee updated successfully' });
  } catch (error) {
    logger.error('Error in updateEmployeeById:', error);
    next(error);
  }
};

const deleteEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM employees WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Error in deleteEmployeeById:', error);
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { client_uuid, full_name, employee_id, id_number, job_title, department, contact_number, email, photo_path, role } = req.body;
    
    // First, try to add role column if it doesn't exist (for backward compatibility)
    try {
      await run('ALTER TABLE employees ADD COLUMN role TEXT DEFAULT "OTHER"');
      logger.info('Added role column to employees table');
    } catch (alterError) {
      // Column might already exist, ignore error
      if (!alterError.message.includes('duplicate column name')) {
        logger.debug('Role column might already exist:', alterError.message);
      }
    }
    
    const sql = `
      INSERT INTO employees (client_uuid, full_name, employee_id, id_number, job_title, department, contact_number, email, photo_path, role, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      client_uuid,
      full_name,
      employee_id,
      id_number,
      job_title,
      department,
      contact_number,
      email,
      photo_path,
      role || 'OTHER'  // Default to 'OTHER' if role not provided
    ];
    const result = await run(sql, params);
    res.status(201).json({ status: 'success', data: { id: result.lastID } });
  } catch (error) {
    logger.error('Error in createEmployee:', error);
    next(error);
  }
};

const getDistinctJobTitles = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT job_title FROM employees WHERE job_title IS NOT NULL ORDER BY job_title');
    const jobTitles = rows.map(row => row.job_title);
    res.status(200).json({ status: 'success', data: jobTitles });
  } catch (error) {
    logger.error('Error in getDistinctJobTitles:', error);
    next(error);
  }
};

const getDistinctDepartments = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department');
    const departments = rows.map(row => row.department);
    res.status(200).json({ status: 'success', data: departments });
  } catch (error) {
    logger.error('Error in getDistinctDepartments:', error);
    next(error);
  }
};

const employeeIdExists = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const rows = await query('SELECT COUNT(*) as count FROM employees WHERE employee_id = ?', [employeeId]);
    const exists = rows[0].count > 0;
    res.status(200).json({ status: 'success', data: exists });
  } catch (error) {
    logger.error('Error in employeeIdExists:', error);
    next(error);
  }
};

module.exports = {
  syncEmployees,
  getAllEmployees,
  getEmployeeById,
  updateEmployeeById,
  deleteEmployeeById,
  createEmployee,
  getDistinctJobTitles,
  getDistinctDepartments,
  employeeIdExists,
};
