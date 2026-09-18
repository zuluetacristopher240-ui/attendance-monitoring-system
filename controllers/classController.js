/**
 * classController.js
 * Handles classes at subjects queries for teachers at students.
 */

const db = require('../config/db');

// ============================================
// ✅ GET MY CLASSES (teacher)
// ============================================
exports.getMyClasses = (req, res) => {
  const teacherId = req.user.id;

  const query = `
    SELECT 
      id,
      class_code,
      class_name,
      year_level,
      section,
      created_at
    FROM classes
    WHERE teacher_id = ?
    ORDER BY class_name ASC
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error('getMyClasses error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ GET SUBJECTS BY CLASS (teacher)
// ============================================
exports.getSubjectsByClass = (req, res) => {
  const teacherId = req.user.id;
  const { classId } = req.params;

  const parsedClassId = parseInt(classId, 10);
  if (!Number.isInteger(parsedClassId) || parsedClassId <= 0) {
    return res.status(400).json({ message: 'Invalid class ID.' });
  }

  const ownerCheck = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
  db.query(ownerCheck, [parsedClassId, teacherId], (err, ownerResult) => {
    if (err) {
      console.error('getSubjectsByClass owner check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (ownerResult.length === 0) {
      return res.status(404).json({ message: 'Class not found or not yours.' });
    }

    const query = `
      SELECT 
        id,
        class_id,
        subject_code,
        subject_name,
        enrollment_code,
        created_at
      FROM subjects
      WHERE class_id = ?
      ORDER BY subject_name ASC
    `;

    db.query(query, [parsedClassId], (err2, results) => {
      if (err2) {
        console.error('getSubjectsByClass error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(200).json(results);
    });
  });
};

// ============================================
// ✅ GET MY SUBJECTS (student)
// ============================================
exports.getMySubjects = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      subjects.id AS subject_id,
      subjects.subject_code,
      subjects.subject_name,
      classes.class_code,
      classes.class_name,
      classes.year_level,
      classes.section,
      teachers.full_name AS teacher_name
    FROM student_subjects
    JOIN students ON student_subjects.student_id = students.id
    JOIN subjects ON student_subjects.subject_id = subjects.id
    JOIN classes ON subjects.class_id = classes.id
    LEFT JOIN users AS teachers ON classes.teacher_id = teachers.id
    WHERE students.user_id = ?
    ORDER BY subjects.subject_name ASC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('getMySubjects error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};