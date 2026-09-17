// ============================================
// ✅ LOAD .env FILE FIRST — BAGO LAHAT!
// ============================================
require('dotenv').config();

// ============================================
// ✅ CRITICAL: JWT_SECRET VALIDATION
// ============================================
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set!');
  console.error('   Railway: Settings → Variables → Add JWT_SECRET');
  console.error('   Local: siguraduhing may JWT_SECRET sa .env file');
  process.exit(1);
}

if (process.env.JWT_SECRET === 'temporary_secret_key') {
  console.error('❌ FATAL: JWT_SECRET is using the default value!');
  console.error('   Please set a strong, random secret.');
  process.exit(1);
}

// ============================================
// IMPORTS
// ============================================
const db = require('./config/db');
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes.js');
const attendanceRoutes = require('./routes/attendanceRoutes');

const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'pages', 'login.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});