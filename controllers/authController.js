const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ============================================
// VALIDATION HELPERS
// ============================================
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number.';
  }
  return null;
}

function validateUsername(username) {
  if (username.length < 3) {
    return 'Username must be at least 3 characters.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores.';
  }
  return null;
}

// ============================================
// REGISTER — gumagawa ng bagong account
// ============================================
exports.register = async (req, res) => {
  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const { username, password, role, full_name, student_id, year_level, section } = req.body;

    if (!username || !password || !role || !full_name) {
      await connection.rollback();
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      await connection.rollback();
      return res.status(400).json({ message: usernameError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      await connection.rollback();
      return res.status(400).json({ message: passwordError });
    }

    if (role === 'student' && (!student_id || !year_level || !section)) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Student ID, year level, and section are required for student sign up.' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, full_name]
    );

    const newUserId = userResult.insertId;

    if (role === 'student') {
      await connection.query(
        'INSERT INTO students (student_id, full_name, year_level, section, user_id) VALUES (?, ?, ?, ?, ?)',
        [student_id, full_name, year_level, section, newUserId]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Account created successfully!' });

  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('username') ? 'Username' : 'Student ID';
      return res.status(409).json({ message: `${field} already exists.` });
    }

    console.error('register error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });

  } finally {
    if (connection) connection.release();
  }
};

// ============================================
// LOGIN — nagve-verify ng account
// ============================================
exports.login = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    // ✅ Gumamit ng promise-based query para sa stable connection
    const [results] = await db.promise().query(query, [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: 'This account is not registered under that role.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
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

  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Database error. Please try again.' });
  }
};