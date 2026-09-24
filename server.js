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
const rateLimit = require('express-rate-limit');
const app = express();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes.js');
const attendanceRoutes = require('./routes/attendanceRoutes');
const classRoutes = require('./routes/classRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// ✅ CORS Restriction — only official domains allowed
const allowedOrigins = [
  'https://website-ni-toper.up.railway.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // ✅ Allow requests without origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: Origin ${origin} is not allowed.`;
      console.warn('🚫 CORS blocked:', origin);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// ============================================
// ✅ RATE LIMITING (Anti-Brute Force)
// ============================================

// ✅ General rate limit — para sa lahat ng API requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                      // 100 requests per 15 min
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Strict rate limit — para sa login (5 attempts lang)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 5,                        // 5 login attempts per 15 min
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Apply general limiter sa lahat ng API
app.use('/api', generalLimiter);

// ============================================
// ROUTES
// ============================================

// ✅ Login route may strict rate limiter
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'pages', 'login.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔒 CORS: ${allowedOrigins.length} allowed origins`);
  console.log(`⏱️  Rate Limit: 5 login attempts per 15 min`);
});