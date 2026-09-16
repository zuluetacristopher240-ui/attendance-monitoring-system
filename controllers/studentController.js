const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET ALL STUDENTS
exports.getAllStudents = (req, res) => {
  const query = 'SELECT * FROM students ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    res.status(200).json(results);
  });
};

// GET SINGLE STUDENT (by id)
exports.getStudentById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM students WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json(results[0]);
  });
};

// CREATE STUDENT (kasama na ang pag-gawa ng account, awtomatiko)
exports.createStudent = async (req, res) => {
  const { student_id, full_name, year_level, section, email, username, password } = req.body;

  if (!student_id || !full_name || !year_level || !section) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    let userId = null;

    // Kung may username/password na ibinigay, gawa muna ng account
    if (username && password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const userInsert = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
          [username, hashedPassword, 'student', full_name],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

      userId = userInsert.insertId;
    }

    // Gawin ang student record, i-link na agad sa userId kung meron
    const query = 'INSERT INTO students (student_id, full_name, year_level, section, email, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [student_id, full_name, year_level, section, email || null, userId], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Student ID or username already exists.' });
        }
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }
      res.status(201).json({
        message: userId ? 'Student added with login account!' : 'Student added successfully!',
        id: result.insertId
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// UPDATE STUDENT
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { student_id, full_name, year_level, section, email } = req.body;

  const query = 'UPDATE students SET student_id = ?, full_name = ?, year_level = ?, section = ?, email = ? WHERE id = ?';
  db.query(query, [student_id, full_name, year_level, section, email || null, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json({ message: 'Student updated successfully!' });
  });
};

// DELETE STUDENT
exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM students WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json({ message: 'Student deleted successfully!' });
  });
};