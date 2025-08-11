const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');

const syncStudents = async (req, res, next) => {
  try {
    const students = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body must be a non-empty array of students.',
      });
    }

    logger.info(`Received request to sync ${students.length} students.`);

    const promises = students.map(student => {
      const sql = `
        INSERT INTO students (client_uuid, full_name, student_code, id_number, grade, classroom, photo_path, face_vector, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(client_uuid) DO UPDATE SET
          full_name = excluded.full_name,
          student_code = excluded.student_code,
          id_number = excluded.id_number,
          grade = excluded.grade,
          classroom = excluded.classroom,
          photo_path = excluded.photo_path,
          face_vector = excluded.face_vector,
          synced = 1;
      `;
      
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      const faceVectorBuffer = student.faceVector ? Buffer.from(student.faceVector, 'base64') : null;

      const params = [
        student.id,
        fullName,
        student.studentCode,
        student.idNumber,
        student.grade,
        student.classroom,
        student.photoPath,
        faceVectorBuffer,
      ];
      
      return run(sql, params);
    });

    await Promise.all(promises);

    logger.info(`Successfully synced ${students.length} students.`);
    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${students.length} students.`,
      data: { receivedCount: students.length },
    });
  } catch (error) {
    logger.error('Error in syncStudents:', error);
    next(error);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const students = await query('SELECT * FROM students');
    
    // Parse full_name into firstName and lastName for JavaFX compatibility
    const studentsWithNames = students.map(student => {
      const fullName = student.full_name || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        ...student,
        firstName: firstName,
        lastName: lastName
      };
    });
    
    // Debug logging to verify parsing
    console.log('DEBUG: getAllStudents response sample:', JSON.stringify(studentsWithNames[0], null, 2));
    
    res.status(200).json({ status: 'success', data: studentsWithNames });
  } catch (error) {
    logger.error('Error in getAllStudents:', error);
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM students WHERE id = ?', [id]);
    const student = rows[0];
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }
    res.status(200).json({ status: 'success', data: student });
  } catch (error) {
    logger.error('Error in getStudentById:', error);
    next(error);
  }
};

const updateStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, student_code, id_number, grade, classroom, photo_path, face_vector } = req.body;

    const sql = `
      UPDATE students SET
        full_name = ?,
        student_code = ?,
        id_number = ?,
        grade = ?,
        classroom = ?,
        photo_path = ?,
        face_vector = ?
      WHERE id = ?;
    `;

    const result = await run(sql, [full_name, student_code, id_number, grade, classroom, photo_path, face_vector || null, id]);

    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found or no changes made' });
    }

    res.status(200).json({ status: 'success', message: 'Student updated successfully' });
  } catch (error) {
    logger.error('Error in updateStudentById:', error);
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { client_uuid, full_name, student_code, id_number, grade, classroom, photo_path, face_vector } = req.body;
    
    // Generate client_uuid if not provided
    const finalClientUuid = client_uuid || require('crypto').randomUUID();
    
    const sql = `
      INSERT INTO students (client_uuid, full_name, student_code, id_number, grade, classroom, photo_path, face_vector, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      finalClientUuid,
      full_name || null,
      student_code || null,
      id_number || null,
      grade || null,
      classroom || null,
      photo_path || null,
      face_vector || null
    ];
    const result = await run(sql, params);
    const studentId = result.lastID;
    res.status(201).json({ status: 'success', data: { id: studentId, client_uuid: finalClientUuid } });
  } catch (error) {
    logger.error('Error in createStudent:', error);
    next(error);
  }
};

const deleteStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM students WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Error in deleteStudentById:', error);
    next(error);
  }
};

const getDistinctGrades = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT grade FROM students WHERE grade IS NOT NULL ORDER BY grade');
    const grades = rows.map(row => row.grade);
    res.status(200).json({ status: 'success', data: grades });
  } catch (error) {
    logger.error('Error in getDistinctGrades:', error);
    next(error);
  }
};

const getDistinctClassrooms = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT classroom FROM students WHERE classroom IS NOT NULL ORDER BY classroom');
    const classrooms = rows.map(row => row.classroom);
    res.status(200).json({ status: 'success', data: classrooms });
  } catch (error) {
    logger.error('Error in getDistinctClassrooms:', error);
    next(error);
  }
};

const getStudentByCode = async (req, res, next) => {
  try {
    const { studentCode } = req.params;
    const rows = await query('SELECT * FROM students WHERE student_code = ?', [studentCode]);
    const student = rows[0];
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }
    res.status(200).json({ status: 'success', data: student });
  } catch (error) {
    logger.error('Error in getStudentByCode:', error);
    next(error);
  }
};

module.exports = {
  syncStudents,
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByCode,
  updateStudentById,
  deleteStudentById,
  getDistinctGrades,
  getDistinctClassrooms,
};
