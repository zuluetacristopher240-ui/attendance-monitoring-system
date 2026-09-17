const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT NG ROUTES AY PROTECTED
router.use(verifyToken);

// ✅ Teacher + Admin
router.get('/stats/today', requireRole('teacher', 'admin'), attendanceController.getTodayStats);
router.get('/summary/report', requireRole('teacher', 'admin'), attendanceController.getAttendanceSummary);
router.get('/:date', requireRole('teacher', 'admin'), attendanceController.getAttendanceByDate);
router.post('/', requireRole('teacher', 'admin'), attendanceController.markAttendance);
router.delete('/:id', requireRole('teacher', 'admin'), attendanceController.deleteAttendance);

// ✅ Teacher only — generate code
router.post('/generate-code', requireRole('teacher'), attendanceController.generateCode);

// ✅ Student only — check-in at my attendance
router.post('/check-in', requireRole('student'), attendanceController.checkIn);
router.get('/my', requireRole('student'), attendanceController.getMyAttendance);

module.exports = router;