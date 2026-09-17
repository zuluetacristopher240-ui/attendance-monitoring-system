const db = require('../config/db');

// ============================================
// GET ATTENDANCE FOR A SPECIFIC DATE
// ============================================
exports.getAttendanceByDate = (req, res) => {
  const { date } = req.params;

  const query = `
    SELECT 
      students.id AS student_id,
      students.student_id AS student_number,
      students.full_name,
      students.year_level,
      students.section,
      attendance.id AS attendance_id,
      attendance.status,
      attendance.time_in,
      attendance.remarks
    FROM students
    LEFT JOIN attendance ON students.id = attendance.student_id AND attendance.date = ?
    ORDER BY students.full_name ASC
  `;

  db.query(query, [date], (err, results) => {
    if (err) {
      console.error('getAttendanceByDate error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// MARK ATTENDANCE
// ============================================
exports.markAttendance = (req, res) => {
  const { student_id, date, status, time_in, remarks } = req.body;

  // ✅ Validation
  const validStatuses = ['present', 'absent', 'late'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  if (!Number.isInteger(student_id) || student_id <= 0) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  if (time_in && !/^\d{2}:\d{2}:\d{2}$/.test(time_in)) {
    return res.status(400).json({ message: 'Invalid time format.' });
  }

  const query = `
    INSERT INTO attendance (student_id, date, status, time_in, remarks)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE status = ?, time_in = ?, remarks = ?
  `;

  db.query(
    query,
    [student_id, date, status, time_in || null, remarks || null, status, time_in || null, remarks || null],
    (err, result) => {
      if (err) {
        console.error('markAttendance error:', err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(200).json({ message: 'Attendance marked successfully!' });
    }
  );
};

// ============================================
// GET TODAY'S STATS
// ============================================
function getTodayInManila() {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const yyyy = manilaTime.getFullYear();
  const mm = String(manilaTime.getMonth() + 1).padStart(2, '0');
  const dd = String(manilaTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

exports.getTodayStats = (req, res) => {
  const today = getTodayInManila();

  const query = `
    SELECT status, COUNT(*) as count
    FROM attendance
    WHERE date = ?
    GROUP BY status
  `;

  db.query(query, [today], (err, results) => {
    if (err) {
      console.error('getTodayStats error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    const stats = { present: 0, absent: 0, late: 0 };
    results.forEach(row => {
      stats[row.status] = row.count;
    });

    db.query('SELECT COUNT(*) as total FROM students', (err2, totalResult) => {
      if (err2) {
        console.error('getTodayStats total error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }
      stats.totalStudents = totalResult[0].total;
      res.status(200).json(stats);
    });
  });
};

// ============================================
// GET ATTENDANCE SUMMARY PER STUDENT
// ============================================
exports.getAttendanceSummary = (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT 
      students.id,
      students.student_id AS student_number,
      students.full_name,
      students.year_level,
      students.section,
      COUNT(CASE WHEN attendance.status = 'present' THEN 1 END) AS present_count,
      COUNT(CASE WHEN attendance.status = 'absent' THEN 1 END) AS absent_count,
      COUNT(CASE WHEN attendance.status = 'late' THEN 1 END) AS late_count
    FROM students
    LEFT JOIN attendance ON students.id = attendance.student_id
  `;

  const params = [];

  if (startDate && endDate) {
    query += ' WHERE attendance.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' GROUP BY students.id ORDER BY students.full_name ASC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('getAttendanceSummary error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// ✅ GET MY ATTENDANCE — userId MULA SA TOKEN
// ============================================
exports.getMyAttendance = (req, res) => {
  // ✅ MULA SA TOKEN, HINDI SA URL!
  const userId = req.user.id;

  const query = `
    SELECT attendance.date, attendance.status, attendance.time_in, attendance.remarks
    FROM attendance
    JOIN students ON attendance.student_id = students.id
    WHERE students.user_id = ?
    ORDER BY attendance.date DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('getMyAttendance error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// DELETE ATTENDANCE RECORD
// ============================================
exports.deleteAttendance = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM attendance WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('deleteAttendance error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }
    res.status(200).json({ message: 'Attendance record cleared.' });
  });
};

// ============================================
// ✅ GENERATE CHECK-IN CODE — teacher_id MULA SA TOKEN
// ============================================
exports.generateCode = (req, res) => {
  // ✅ MULA SA TOKEN, HINDI SA BODY!
  const teacher_id = req.user.id;

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = getTodayInManila();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const query = 'INSERT INTO attendance_codes (code, teacher_id, date, expires_at) VALUES (?, ?, ?, ?)';
  db.query(query, [code, teacher_id, today, expiresAt], (err, result) => {
    if (err) {
      console.error('generateCode error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(201).json({ code, expiresAt });
  });
};

// ============================================
// ✅ STUDENT CHECK-IN — user_id MULA SA TOKEN
// ============================================
exports.checkIn = (req, res) => {
  const { code } = req.body;
  // ✅ MULA SA TOKEN, HINDI SA BODY!
  const user_id = req.user.id;

  if (!code) {
    return res.status(400).json({ message: 'code is required.' });
  }

  const codeQuery = 'SELECT * FROM attendance_codes WHERE code = ? ORDER BY created_at DESC LIMIT 1';
  db.query(codeQuery, [code.toUpperCase()], (err, codeResults) => {
    if (err) {
      console.error('checkIn code query error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (codeResults.length === 0) {
      return res.status(404).json({ message: 'Invalid code.' });
    }

    const codeData = codeResults[0];
    const now = new Date();

    if (new Date(codeData.expires_at) < now) {
      return res.status(410).json({ message: 'This code has expired.' });
    }

    const studentQuery = 'SELECT id FROM students WHERE user_id = ?';
    db.query(studentQuery, [user_id], (err2, studentResults) => {
      if (err2) {
        console.error('checkIn student query error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (studentResults.length === 0) {
        return res.status(404).json({ message: 'No student profile linked to your account.' });
      }

      const studentId = studentResults[0].id;
      const timeIn = now.toTimeString().split(' ')[0];

      const markQuery = `
        INSERT INTO attendance (student_id, date, status, time_in)
        VALUES (?, ?, 'present', ?)
        ON DUPLICATE KEY UPDATE status = 'present', time_in = ?
      `;

      db.query(markQuery, [studentId, codeData.date, timeIn, timeIn], (err3) => {
        if (err3) {
          console.error('checkIn mark error:', err3);
          return res.status(500).json({ message: 'Database error.' });
        }
        res.status(200).json({ message: 'Checked in successfully! You are marked present.' });
      });
    });
  });
};