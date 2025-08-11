const { run, query } = require('./config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { logger } = require('../utils/logger');

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Clear existing data (except users to preserve admin accounts)
    await run('DELETE FROM incidents');
    await run('DELETE FROM students');
    await run('DELETE FROM employees');
    await run('DELETE FROM attendance_logs');
    await run('DELETE FROM visitors');
    await run('DELETE FROM cards');
    await run('VACUUM');
    
    // Check if we have any users
    const users = await query('SELECT id FROM users');
    if (!users || users.length === 0) {
      // Create default admin user if none exists
      const adminPassword = await bcrypt.hash('admin123', 10);
      await run(
        'INSERT INTO users (client_uuid, username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'admin', 'admin@school.edu', adminPassword, 'Administrator', 'admin', 1]
      );
    }

    // Sample Students
    const student1 = {
      client_uuid: uuidv4(),
      full_name: 'John Doe',
      student_code: 'STU001',
      id_number: '2001014800082',
      grade: '10',
      classroom: '10A',
      photo_path: 'students/john_doe.jpg',
      synced: 1
    };

    const student2 = {
      client_uuid: uuidv4(),
      full_name: 'Jane Smith',
      student_code: 'STU002',
      id_number: '2002025800083',
      grade: '11',
      classroom: '11B',
      photo_path: 'students/jane_smith.jpg',
      synced: 1
    };

    // Sample Employees
    const teacher1 = {
      client_uuid: uuidv4(),
      full_name: 'Sarah Johnson',
      employee_id: 'TEA001',
      job_title: 'Mathematics Teacher',
      department: 'Mathematics',
      contact_number: '0821234567',
      email: 'sarah.johnson@school.edu',
      photo_path: 'employees/sarah_j.jpg',
      role: 'TEACHER',
      synced: 1
    };

    const admin1 = {
      client_uuid: uuidv4(),
      full_name: 'Michael Brown',
      employee_id: 'ADM001',
      job_title: 'School Administrator',
      department: 'Administration',
      contact_number: '0837654321',
      email: 'michael.brown@school.edu',
      photo_path: 'employees/michael_b.jpg',
      role: 'ADMIN',
      synced: 1
    };

    // Sample Incidents
    const incident1 = {
      client_uuid: uuidv4(),
      user_id: 1, // John Doe
      user_type: 'student',
      description: 'Late for class',
      incident_type: 'Tardiness',
      reporter_name: 'Sarah Johnson',
      reported_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      synced: 1
    };

    const incident2 = {
      client_uuid: uuidv4(),
      user_id: 2, // Jane Smith
      user_type: 'student',
      description: 'Disruptive behavior in class',
      incident_type: 'Behavioral',
      reporter_name: 'Michael Brown',
      reported_at: new Date().toISOString(),
      synced: 1
    };

    // Insert Students
    await run(
      'INSERT INTO students (client_uuid, full_name, student_code, id_number, grade, classroom, photo_path, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student1.client_uuid, student1.full_name, student1.student_code, student1.id_number, student1.grade, student1.classroom, student1.photo_path, student1.synced]
    );

    await run(
      'INSERT INTO students (client_uuid, full_name, student_code, id_number, grade, classroom, photo_path, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student2.client_uuid, student2.full_name, student2.student_code, student2.id_number, student2.grade, student2.classroom, student2.photo_path, student2.synced]
    );

    // Insert Employees
    await run(
      'INSERT INTO employees (client_uuid, full_name, employee_id, job_title, department, contact_number, email, photo_path, role, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [teacher1.client_uuid, teacher1.full_name, teacher1.employee_id, teacher1.job_title, teacher1.department, teacher1.contact_number, teacher1.email, teacher1.photo_path, teacher1.role, teacher1.synced]
    );

    await run(
      'INSERT INTO employees (client_uuid, full_name, employee_id, job_title, department, contact_number, email, photo_path, role, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [admin1.client_uuid, admin1.full_name, admin1.employee_id, admin1.job_title, admin1.department, admin1.contact_number, admin1.email, admin1.photo_path, admin1.role, admin1.synced]
    );

    // Insert Incidents
    await run(
      'INSERT INTO incidents (client_uuid, user_id, user_type, description, incident_type, reporter_name, reported_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [incident1.client_uuid, incident1.user_id, incident1.user_type, incident1.description, incident1.incident_type, incident1.reporter_name, incident1.reported_at, incident1.synced]
    );

    await run(
      'INSERT INTO incidents (client_uuid, user_id, user_type, description, incident_type, reporter_name, reported_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [incident2.client_uuid, incident2.user_id, incident2.user_type, incident2.description, incident2.incident_type, incident2.reporter_name, incident2.reported_at, incident2.synced]
    );

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
