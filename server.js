require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set!');
  process.exit(1);
}

if (process.env.JWT_SECRET === 'temporary_secret_key') {
  console.error('FATAL: JWT_SECRET is using the default value!');
  process.exit(1);
}

const db = require('./config/db');
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes.js');
const attendanceRoutes = require('./routes/attendanceRoutes');
const classRoutes = require('./routes/classRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;

const allowedOrigins = [
  'https://website-ni-toper.vercel.app',
  'https://website-ni-toper-git-main.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://website-ni-toper.up.railway.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS blocked'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
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

app.get('/:page.html', (req, res) => {
  const pageName = req.params.page;
  const filePath = path.join(__dirname, 'frontend', 'pages', `${pageName}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

app.use('/pages', express.static(path.join(__dirname, 'frontend', 'pages')));

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;