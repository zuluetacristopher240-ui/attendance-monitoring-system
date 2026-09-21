const db = require('../config/db');

// ============================================
// HELPER: Today's date in Manila timezone
// ============================================
function getTodayInManila() {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const yyyy = manilaTime.getFullYear();
  const mm = String(manilaTime.getMonth() + 1).padStart(2, '0');
  const dd = String(manilaTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ============================================
// HELPER: Current time in Manila (HH:MM:SS)
// ============================================
function getNowTimeInManila() {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const hh = String(manilaTime.getHours()).padStart(2, '0');
  const mm = String(manilaTime.getMinutes()).padStart(2, '0');
  const ss = String(manilaTime.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

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
// ✅ BAGO: GET STUDENTS FOR A CLASS+SUBJECT
// ============================================
exports.getSessionStudents = (req, res) => {
  const { classId, subjectId } = req.params;
  const teacherId = req.user.id;
  const today = getTodayInManila();

  const parsedClassId = parseInt(classId, 10);
  const parsedSubjectId = parseInt(subjectId, 10);

  if (!Number.isInteger(parsedClassId) || !Number.isInteger(parsedSubjectId)) {
    return res.status(400).json({ message: 'Invalid class or subject ID.' });
  }

  const ownerCheck = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
  db.query(ownerCheck, [parsedClassId, teacherId], (err, ownerResult) => {
    if (err) {
      console.error('getSessionStudents owner check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (ownerResult.length === 0) {
      return res.status(404).json({ message: 'Class not found or not yours.' });
    }

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
      FROM student_subjects
      JOIN students ON student_subjects.student_id = students.id
      LEFT JOIN attendance 
        ON attendance.student_id = students.id 
        AND attendance.date = ? 
        AND attendance.subject_id = ?
      WHERE student_subjects.subject_id = ?
      ORDER BY students.full_name ASC
    `;

    db.query(query, [today, parsedSubjectId, parsedSubjectId], (err2, results) => {
      if (err2) {
        console.error('getSessionStudents error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(200).json(results);
    });
  });
};

// ============================================
// MARK ATTENDANCE
// ============================================
exports.markAttendance = (req, res) => {
  const { student_id, date, status, time_in, remarks, subject_id, session_id } = req.body;

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
    INSERT INTO attendance (student_id, subject_id, date, status, time_in, remarks, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      status = ?, 
      time_in = ?, 
      remarks = ?,
      session_id = ?
  `;

  db.query(
    query,
    [
      student_id, subject_id || null, date, status, time_in || null, remarks || null, session_id || null,
      status, time_in || null, remarks || null, session_id || null
    ],
    (err) => {
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
// ✅ BAGO: GET HEATMAP DATA
// ============================================
exports.getHeatmapData = (req, res) => {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = manilaTime.getFullYear();
  const month = manilaTime.getMonth() + 1;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const attendanceQuery = `
    SELECT 
      date,
      COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
      COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
      COUNT(*) AS total_count
    FROM attendance
    WHERE date BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date ASC
  `;

  db.query(attendanceQuery, [firstDay, lastDay], (err, results) => {
    if (err) {
      console.error('getHeatmapData error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    const studentQuery = 'SELECT COUNT(*) AS total_students FROM students';
    db.query(studentQuery, (err2, studentResult) => {
      if (err2) {
        console.error('getHeatmapData student count error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }

      const totalStudents = studentResult[0].total_students || 0;

      const dataByDate = {};
      results.forEach(r => {
        dataByDate[r.date] = r;
      });

      const heatmapData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = dataByDate[dateStr];

        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        let marked = 0;

        if (record) {
          presentCount = record.present_count || 0;
          lateCount = record.late_count || 0;
          absentCount = record.absent_count || 0;
          marked = presentCount + lateCount + absentCount;
        }

        let rate = 0;
        if (totalStudents > 0) {
          rate = Math.round(((presentCount + lateCount) / totalStudents) * 100);
        }

        heatmapData.push({
          date: dateStr,
          day: day,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          marked: marked,
          total: totalStudents,
          rate: rate
        });
      }

      res.status(200).json({
        year: year,
        month: month,
        monthName: manilaTime.toLocaleString('en-US', { month: 'long' }),
        totalStudents: totalStudents,
        days: heatmapData
      });
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
// GET MY ATTENDANCE — with subject info
// ============================================
exports.getMyAttendance = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      attendance.date, 
      attendance.status, 
      attendance.time_in, 
      attendance.remarks,
      subjects.subject_code,
      subjects.subject_name
    FROM attendance
    JOIN students ON attendance.student_id = students.id
    LEFT JOIN subjects ON attendance.subject_id = subjects.id
    WHERE students.user_id = ?
    ORDER BY attendance.date DESC, attendance.time_in DESC
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
// GENERATE CHECK-IN CODE
// ============================================
exports.generateCode = (req, res) => {
  const teacher_id = req.user.id;
  const { class_id, subject_id, start_time, end_time } = req.body;

  if (!class_id || !subject_id || !start_time || !end_time) {
    return res.status(400).json({ message: 'class_id, subject_id, start_time, and end_time are required.' });
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(start_time) || !/^\d{2}:\d{2}(:\d{2})?$/.test(end_time)) {
    return res.status(400).json({ message: 'Invalid time format. Use HH:MM or HH:MM:SS.' });
  }

  if (start_time >= end_time) {
    return res.status(400).json({ message: 'End time must be after start time.' });
  }

  const ownerCheck = 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';
  db.query(ownerCheck, [class_id, teacher_id], (err, ownerResult) => {
    if (err) {
      console.error('generateCode owner check error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (ownerResult.length === 0) {
      return res.status(404).json({ message: 'Class not found or not yours.' });
    }

    const subjectCheck = 'SELECT id FROM subjects WHERE id = ? AND class_id = ?';
    db.query(subjectCheck, [subject_id, class_id], (err2, subjectResult) => {
      if (err2) {
        console.error('generateCode subject check error:', err2);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (subjectResult.length === 0) {
        return res.status(404).json({ message: 'Subject not found for this class.' });
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const today = getTodayInManila();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const insertQuery = `
        INSERT INTO attendance_sessions 
        (teacher_id, attendance_date, start_time, end_time, code, expires_at, active, class_id, subject_id)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `;

      db.query(
        insertQuery,
        [teacher_id, today, start_time, end_time, code, expiresAt, class_id, subject_id],
        (err3, result) => {
          if (err3) {
            console.error('generateCode insert error:', err3);
            return res.status(500).json({ message: 'Database error.' });
          }
          res.status(201).json({
            message: 'Check-in code generated!',
            session_id: result.insertId,
            code,
            expiresAt,
            start_time,
            end_time
          });
        }
      );
    });
  });
};

// ============================================
// STUDENT CHECK-IN
// ============================================
exports.checkIn = (req, res) => {
  const { code } = req.body;
  const user_id = req.user.id;

  if (!code) {
    return res.status(400).json({ message: 'Code is required.' });
  }

  const sessionQuery = `
    SELECT * FROM attendance_sessions 
    WHERE code = ? AND active = 1
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  db.query(sessionQuery, [code.toUpperCase()], (err, sessionResults) => {
    if (err) {
      console.error('checkIn session query error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (sessionResults.length === 0) {
      return res.status(404).json({ message: 'Invalid code.' });
    }

    const session = sessionResults[0];
    const now = new Date();
    const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const nowTimeStr = getNowTimeInManila();
    const today = getTodayInManila();

    if (new Date(session.expires_at) < now) {
      return res.status(410).json({ message: 'This code has expired.' });
    }

    if (nowTimeStr > session.end_time) {
      return res.status(410).json({ message: 'This class session is already closed.' });
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
      const subjectId = session.subject_id;

      const startTime = session.start_time;
      const [startH, startM, startS] = startTime.split(':').map(Number);
      const startDate = new Date(nowManila);
      startDate.setHours(startH, startM, startS || 0, 0);

      const diffMs = nowManila - startDate;
      const diffMin = diffMs / (1000 * 60);

      let status = 'present';
      if (diffMin > 10) {
        status = 'late';
      }

      const enrollQuery = `
        INSERT IGNORE INTO student_subjects (student_id, subject_id)
        VALUES (?, ?)
      `;

      db.query(enrollQuery, [studentId, subjectId], (errEnroll) => {
        if (errEnroll) {
          console.error('checkIn auto-enroll error:', errEnroll);
        }

        const markQuery = `
          INSERT INTO attendance (student_id, subject_id, date, status, time_in, session_id)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            status = ?, 
            time_in = ?, 
            session_id = ?
        `;

        db.query(
          markQuery,
          [studentId, subjectId, today, status, nowTimeStr, session.id,
           status, nowTimeStr, session.id],
          (err3) => {
            if (err3) {
              console.error('checkIn mark error:', err3);
              return res.status(500).json({ message: 'Database error.' });
            }

            const label = status === 'present' ? 'Present' : 'Late';
            res.status(200).json({
              message: `Checked in successfully! You are marked ${label}.`,
              status,
              time_in: nowTimeStr
            });
          }
        );
      });
    });
  });
};