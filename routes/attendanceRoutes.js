const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT NG ROUTES AY PROTECTED
router.use(verifyToken);

// ============================================
// SPECIFIC ROUTES — dapat mauna
// ============================================

// ✅ Teacher + Admin
router.get('/stats/today', requireRole('teacher', 'admin'), attendanceController.getTodayStats);
router.get('/summary/report', requireRole('teacher', 'admin'), attendanceController.getAttendanceSummary);

// ✅ Teacher only — generate code
router.post('/generate-code', requireRole('teacher'), attendanceController.generateCode);

// ✅ Teacher only — get students for class+subject (BAGO)
router.get(
  '/session/:classId/:subjectId/students',
  requireRole('teacher', 'admin'),
  attendanceController.getSessionStudents
);

// ✅ Student only — check-in at my attendance
router.post('/check-in', requireRole('student'), attendanceController.checkIn);
router.get('/my', requireRole('student'), attendanceController.getMyAttendance);

// ✅ Teacher + Admin
router.post('/', requireRole('teacher', 'admin'), attendanceController.markAttendance);
router.delete('/:id', requireRole('teacher', 'admin'), attendanceController.deleteAttendance);

// ============================================
// GENERIC ROUTE — dapat sa DULO
// ============================================
router.get('/:date', requireRole('teacher', 'admin'), attendanceController.getAttendanceByDate);

module.exports = router;