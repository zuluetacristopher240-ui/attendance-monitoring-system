/**
 * classController.js
 * Handles classes at subjects queries for teachers at students.
 */

const db = require('../config/db');

// Helper: today's date
function getTodayInManila() {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const yyyy = manilaTime.getFullYear();
  const mm = String(manilaTime.getMonth() + 1).padStart(2, '0');
  const dd = String(manilaTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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
// ✅ GET MY SUBJECTS (student) — with active session info
// ============================================
exports.getMySubjects = (req, res) => {
  const userId = req.user.id;
  const today = getTodayInManila();

  const query = `
    SELECT 
      subjects.id AS subject_id,
      subjects.subject_code,
      subjects.subject_name,
      classes.id AS class_id,
      classes.class_code,
      classes.class_name,
      classes.year_level,
      classes.section,
      teachers.full_name AS teacher_name,
      (
        SELECT attendance_sessions.id 
        FROM attendance_sessions 
        WHERE attendance_sessions.subject_id = subjects.id
          AND attendance_sessions.attendance_date = ?
          AND attendance_sessions.active = 1
          AND attendance_sessions.expires_at > NOW()
        ORDER BY attendance_sessions.created_at DESC
        LIMIT 1
      ) AS active_session_id,
      (
        SELECT attendance_sessions.end_time
        FROM attendance_sessions 
        WHERE attendance_sessions.subject_id = subjects.id
          AND attendance_sessions.attendance_date = ?
          AND attendance_sessions.active = 1
          AND attendance_sessions.expires_at > NOW()
        ORDER BY attendance_sessions.created_at DESC
        LIMIT 1
      ) AS active_session_end_time
    FROM student_subjects
    JOIN students ON student_subjects.student_id = students.id
    JOIN subjects ON student_subjects.subject_id = subjects.id
    JOIN classes ON subjects.class_id = classes.id
    LEFT JOIN users AS teachers ON classes.teacher_id = teachers.id
    WHERE students.user_id = ?
    ORDER BY subjects.subject_name ASC
  `;

  db.query(query, [today, today, userId], (err, results) => {
    if (err) {
      console.error('getMySubjects error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ BAGO: GET ACTIVE SESSION FOR A SUBJECT (student)
// ============================================
exports.getActiveSession = (req, res) => {
  const { subjectId } = req.params;
  const today = getTodayInManila();

  const parsedSubjectId = parseInt(subjectId, 10);
  if (!Number.isInteger(parsedSubjectId) || parsedSubjectId <= 0) {
    return res.status(400).json({ message: 'Invalid subject ID.' });
  }

  const query = `
    SELECT 
      id AS session_id,
      code,
      start_time,
      end_time,
      expires_at,
      active
    FROM attendance_sessions
    WHERE subject_id = ?
      AND attendance_date = ?
      AND active = 1
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(query, [parsedSubjectId, today], (err, results) => {
    if (err) {
      console.error('getActiveSession error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(200).json({ active: false, session: null });
    }

    res.status(200).json({ active: true, session: results[0] });
  });
};