const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER — gumagawa ng bagong account
exports.register = async (req, res) => {
  try {
    const { username, password, role, full_name, student_id, year_level, section } = req.body;

    if (!username || !password || !role || !full_name) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (role === 'student' && (!student_id || !year_level || !section)) {
      return res.status(400).json({ message: 'Student ID, year level, and section are required for student sign up.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userQuery = 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)';
    db.query(userQuery, [username, hashedPassword, role, full_name], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Username already exists.' });
        }
        return res.status(500).json({ message: 'Database error.', error: err.message });
      }

      const newUserId = result.insertId;

      // Kung student, gumawa rin ng student profile na naka-link agad
      if (role === 'student') {
        const studentQuery = 'INSERT INTO students (student_id, full_name, year_level, section, user_id) VALUES (?, ?, ?, ?, ?)';
        db.query(studentQuery, [student_id, full_name, year_level, section, newUserId], (err2) => {
          if (err2) {
            if (err2.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({ message: 'Student ID already exists.' });
            }
            return res.status(500).json({ message: 'Database error.', error: err2.message });
          }
          res.status(201).json({ message: 'Account created successfully!' });
        });
      } else {
        res.status(201).json({ message: 'Account created successfully!' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// LOGIN — nagve-verify ng account
exports.login = (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // ITO ANG FIX — dapat tugma yung role ng account sa role na pinili sa login screen
    if (role && user.role !== role) {
      return res.status(401).json({ message: 'This account is not registered under that role.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'temporary_secret_key',
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  });
};