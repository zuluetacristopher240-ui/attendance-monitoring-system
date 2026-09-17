const db = require('../config/db');
const bcrypt = require('bcrypt');

// ============================================
// GET ALL STUDENTS
// ============================================
exports.getAllStudents = (req, res) => {
  const query = 'SELECT * FROM students ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('getAllStudents error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(200).json(results);
  });
};

// ============================================
// GET SINGLE STUDENT
// ============================================
exports.getStudentById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM students WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('getStudentById error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json(results[0]);
  });
};

// ============================================
// ✅ CREATE STUDENT — Naka-TRANSACTION
// ============================================
exports.createStudent = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { student_id, full_name, year_level, section, email, username, password } = req.body;

    // ✅ Validation
    if (!student_id || !full_name || !year_level || !section) {
      await connection.rollback();
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    let userId = null;

    // ✅ Kung may username/password, gawa muna ng account
    if (username && password) {
      // ✅ Validate password
      if (password.length < 8) {
        await connection.rollback();
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, 'student', full_name]
      );

      userId = userResult.insertId;
    }

    // ✅ Insert student record
    await connection.query(
      'INSERT INTO students (student_id, full_name, year_level, section, email, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, full_name, year_level, section, email || null, userId]
    );

    await connection.commit();

    res.status(201).json({
      message: userId ? 'Student added with login account!' : 'Student added successfully!'
    });

  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Student ID or username already exists.' });
    }

    console.error('createStudent error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });

  } finally {
    connection.release();
  }
};

// ============================================
// UPDATE STUDENT
// ============================================
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { student_id, full_name, year_level, section, email } = req.body;

  // ✅ Validation
  if (!student_id || !full_name || !year_level || !section) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  const query = 'UPDATE students SET student_id = ?, full_name = ?, year_level = ?, section = ?, email = ? WHERE id = ?';
  db.query(query, [student_id, full_name, year_level, section, email || null, id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Student ID already exists.' });
      }
      console.error('updateStudent error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json({ message: 'Student updated successfully!' });
  });
};

// ============================================
// DELETE STUDENT
// ============================================
exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM students WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('deleteStudent error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json({ message: 'Student deleted successfully!' });
  });
};