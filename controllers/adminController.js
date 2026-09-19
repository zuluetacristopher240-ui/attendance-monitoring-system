/**
 * adminController.js
 * Admin CRUD for classes at subjects.
 */

const db = require('../config/db');

// ============================================
// ✅ GET ALL CLASSES (with teacher info)
// ============================================
exports.getAllClasses = (req, res) => {
  const query = `
    SELECT 
      classes.id,
      classes.class_code,
      classes.class_name,
      classes.year_level,
      classes.section,
      classes.teacher_id,
      classes.created_at,
      users.full_name AS teacher_name,
      (SELECT COUNT(*) FROM subjects WHERE subjects.class_id = classes.id) AS subject_count,
      (SELECT COUNT(*) FROM students WHERE students.section = classes.section AND students.year_level = classes.year_level) AS student_count
    FROM classes
    LEFT JOIN users ON classes.teacher_id = users.id
    ORDER BY classes.class_code ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('getAllClasses error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ GET ALL TEACHERS (for dropdown)
// ============================================
exports.getAllTeachers = (req, res) => {
  const query = `
    SELECT id, username, full_name
    FROM users
    WHERE role = 'teacher'
    ORDER BY full_name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('getAllTeachers error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ CREATE CLASS
// ============================================
exports.createClass = (req, res) => {
  const { teacher_id, class_code, class_name, year_level, section } = req.body;

  if (!teacher_id || !class_code || !class_name || !year_level || !section) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const query = `
    INSERT INTO classes (teacher_id, class_code, class_name, year_level, section)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [teacher_id, class_code, class_name, year_level, section], (err, result) => {
    if (err) {
      console.error('createClass error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Class code already exists.' });
      }
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(201).json({ message: 'Class created!', id: result.insertId });
  });
};

// ============================================
// ✅ UPDATE CLASS
// ============================================
exports.updateClass = (req, res) => {
  const { id } = req.params;
  const { teacher_id, class_code, class_name, year_level, section } = req.body;

  if (!teacher_id || !class_code || !class_name || !year_level || !section) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const query = `
    UPDATE classes
    SET teacher_id = ?, class_code = ?, class_name = ?, year_level = ?, section = ?
    WHERE id = ?
  `;

  db.query(query, [teacher_id, class_code, class_name, year_level, section, id], (err, result) => {
    if (err) {
      console.error('updateClass error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Class code already exists.' });
      }
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found.' });
    }
    res.status(200).json({ message: 'Class updated!' });
  });
};

// ============================================
// ✅ DELETE CLASS
// ============================================
exports.deleteClass = (req, res) => {
  const { id } = req.params;

  // ✅ Check kung may subjects o students
  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM subjects WHERE class_id = ?) AS subject_count
  `;

  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      console.error('deleteClass check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (result[0].subject_count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete: may ${result[0].subject_count} subject(s) pa. Delete subjects first.`
      });
    }

    const deleteQuery = 'DELETE FROM classes WHERE id = ?';
    db.query(deleteQuery, [id], (err2, deleteResult) => {
      if (err2) {
        console.error('deleteClass error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Class not found.' });
      }
      res.status(200).json({ message: 'Class deleted!' });
    });
  });
};

// ============================================
// ✅ GET ALL SUBJECTS (with class info)
// ============================================
exports.getAllSubjects = (req, res) => {
  const { classId } = req.query;

  let query = `
    SELECT 
      subjects.id,
      subjects.class_id,
      subjects.teacher_id,
      subjects.subject_code,
      subjects.subject_name,
      subjects.enrollment_code,
      subjects.created_at,
      classes.class_code,
      classes.class_name,
      users.full_name AS teacher_name,
      (SELECT COUNT(*) FROM student_subjects WHERE student_subjects.subject_id = subjects.id) AS enrolled_count
    FROM subjects
    LEFT JOIN classes ON subjects.class_id = classes.id
    LEFT JOIN users ON subjects.teacher_id = users.id
  `;

  const params = [];

  if (classId) {
    query += ' WHERE subjects.class_id = ?';
    params.push(classId);
  }

  query += ' ORDER BY classes.class_code ASC, subjects.subject_code ASC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('getAllSubjects error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ CREATE SUBJECT
// ============================================
exports.createSubject = (req, res) => {
  const { class_id, subject_code, subject_name, enrollment_code } = req.body;

  if (!class_id || !subject_code || !subject_name) {
    return res.status(400).json({ message: 'Class, subject code, at subject name are required.' });
  }

  // ✅ Get teacher_id from class
  const classQuery = 'SELECT teacher_id FROM classes WHERE id = ?';
  db.query(classQuery, [class_id], (err, classResult) => {
    if (err) {
      console.error('createSubject class query error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (classResult.length === 0) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const teacher_id = classResult[0].teacher_id;

    // ✅ Auto-generate enrollment_code kung wala
    let finalEnrollmentCode = enrollment_code;
    if (!finalEnrollmentCode) {
      finalEnrollmentCode = 'ENR-' + subject_code.toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    const insertQuery = `
      INSERT INTO subjects (teacher_id, class_id, subject_code, subject_name, enrollment_code)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [teacher_id, class_id, subject_code, subject_name, finalEnrollmentCode],
      (err2, result) => {
        if (err2) {
          console.error('createSubject error:', err2);
          if (err2.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Subject code or enrollment code already exists.' });
          }
          return res.status(500).json({ message: 'Database error.' });
        }
        res.status(201).json({
          message: 'Subject created!',
          id: result.insertId,
          enrollment_code: finalEnrollmentCode
        });
      }
    );
  });
};

// ============================================
// ✅ UPDATE SUBJECT
// ============================================
exports.updateSubject = (req, res) => {
  const { id } = req.params;
  const { subject_code, subject_name, enrollment_code } = req.body;

  if (!subject_code || !subject_name) {
    return res.status(400).json({ message: 'Subject code at subject name are required.' });
  }

  const query = `
    UPDATE subjects
    SET subject_code = ?, subject_name = ?, enrollment_code = ?
    WHERE id = ?
  `;

  db.query(query, [subject_code, subject_name, enrollment_code || null, id], (err, result) => {
    if (err) {
      console.error('updateSubject error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Subject code already exists.' });
      }
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    res.status(200).json({ message: 'Subject updated!' });
  });
};

// ============================================
// ✅ DELETE SUBJECT
// ============================================
exports.deleteSubject = (req, res) => {
  const { id } = req.params;

  // ✅ Check kung may enrolled students
  const checkQuery = 'SELECT COUNT(*) AS count FROM student_subjects WHERE subject_id = ?';
  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      console.error('deleteSubject check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (result[0].count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete: may ${result[0].count} enrolled student(s) pa.`
      });
    }

    const deleteQuery = 'DELETE FROM subjects WHERE id = ?';
    db.query(deleteQuery, [id], (err2, deleteResult) => {
      if (err2) {
        console.error('deleteSubject error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Subject not found.' });
      }
      res.status(200).json({ message: 'Subject deleted!' });
    });
  });
};