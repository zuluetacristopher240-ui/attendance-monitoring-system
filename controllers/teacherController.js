/**
 * teacherController.js
 * Teacher — manage own subjects.
 */

const db = require('../config/db');

// ============================================
// ✅ GET ALL SUBJECTS (teacher's own)
// ============================================
exports.getMySubjects = (req, res) => {
  const teacherId = req.user.id;

  const query = `
    SELECT 
      subjects.id,
      subjects.subject_code,
      subjects.subject_name,
      subjects.enrollment_code,
      subjects.class_id,
      classes.class_code,
      classes.class_name,
      (SELECT COUNT(*) FROM student_subjects WHERE student_subjects.subject_id = subjects.id) AS enrolled_count,
      subjects.created_at
    FROM subjects
    LEFT JOIN classes ON subjects.class_id = classes.id
    WHERE subjects.teacher_id = ?
    ORDER BY classes.class_code ASC, subjects.subject_code ASC
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error('getMySubjects (teacher) error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ GET ALL CLASSES (for dropdown — all classes)
// ============================================
exports.getAllClassesForTeacher = (req, res) => {
  const query = `
    SELECT 
      classes.id,
      classes.class_code,
      classes.class_name,
      classes.year_level,
      classes.section,
      users.full_name AS teacher_name
    FROM classes
    LEFT JOIN users ON classes.teacher_id = users.id
    ORDER BY classes.class_code ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('getAllClassesForTeacher error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ CREATE SUBJECT (teacher)
// ============================================
exports.createSubject = (req, res) => {
  const teacherId = req.user.id;
  const { class_id, subject_code, subject_name, enrollment_code } = req.body;

  if (!class_id || !subject_code || !subject_name) {
    return res.status(400).json({ message: 'Class, subject code, at subject name ay required.' });
  }

  // ✅ Verify class exists
  const classQuery = 'SELECT id FROM classes WHERE id = ?';
  db.query(classQuery, [class_id], (err, classResult) => {
    if (err) {
      console.error('createSubject (teacher) class query error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (classResult.length === 0) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // ✅ Auto-generate enrollment code kung wala
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
      [teacherId, class_id, subject_code, subject_name, finalEnrollmentCode],
      (err2, result) => {
        if (err2) {
          console.error('createSubject (teacher) error:', err2);
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
// ✅ UPDATE SUBJECT (teacher — sarili lang)
// ============================================
exports.updateSubject = (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;
  const { subject_code, subject_name, enrollment_code } = req.body;

  if (!subject_code || !subject_name) {
    return res.status(400).json({ message: 'Subject code at subject name ay required.' });
  }

  // ✅ Verify ownership
  const ownerCheck = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
  db.query(ownerCheck, [id, teacherId], (err, ownerResult) => {
    if (err) {
      console.error('updateSubject (teacher) owner check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (ownerResult.length === 0) {
      return res.status(404).json({ message: 'Subject not found or not yours.' });
    }

    const query = `
      UPDATE subjects
      SET subject_code = ?, subject_name = ?, enrollment_code = ?
      WHERE id = ?
    `;

    db.query(query, [subject_code, subject_name, enrollment_code || null, id], (err2) => {
      if (err2) {
        console.error('updateSubject (teacher) error:', err2);
        if (err2.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Subject code already exists.' });
        }
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(200).json({ message: 'Subject updated!' });
    });
  });
};

// ============================================
// ✅ DELETE SUBJECT (teacher — sarili lang)
// ============================================
exports.deleteSubject = (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;

  // ✅ Verify ownership
  const ownerCheck = 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?';
  db.query(ownerCheck, [id, teacherId], (err, ownerResult) => {
    if (err) {
      console.error('deleteSubject (teacher) owner check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (ownerResult.length === 0) {
      return res.status(404).json({ message: 'Subject not found or not yours.' });
    }

    // ✅ Check enrolled students
    const checkQuery = 'SELECT COUNT(*) AS count FROM student_subjects WHERE subject_id = ?';
    db.query(checkQuery, [id], (err2, result) => {
      if (err2) {
        console.error('deleteSubject (teacher) check error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (result[0].count > 0) {
        return res.status(400).json({ 
          message: `Hindi pwedeng i-delete: may ${result[0].count} enrolled student(s) pa.`
        });
      }

      const deleteQuery = 'DELETE FROM subjects WHERE id = ?';
      db.query(deleteQuery, [id], (err3, deleteResult) => {
        if (err3) {
          console.error('deleteSubject (teacher) error:', err3);
          return res.status(500).json({ message: 'Database error.' });
        }
        res.status(200).json({ message: 'Subject deleted!' });
      });
    });
  });
};