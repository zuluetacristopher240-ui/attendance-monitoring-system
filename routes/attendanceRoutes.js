const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');
router.use(verifyToken);
router.get('/stats/today', requireRole('teacher', 'admin'), attendanceController.getTodayStats);
router.get('/heatmap', requireRole('teacher', 'admin'), attendanceController.getHeatmapData);
router.get('/summary/report', requireRole('teacher', 'admin'), attendanceController.getAttendanceSummary);
router.post('/generate-code', requireRole('teacher'), attendanceController.generateCode);
router.get(
  '/session/:classId/:subjectId/students',
  requireRole('teacher', 'admin'),
  attendanceController.getSessionStudents
);
router.post('/check-in', requireRole('student'), attendanceController.checkIn);
router.get('/my', requireRole('student'), attendanceController.getMyAttendance);
router.post('/', requireRole('teacher', 'admin'), attendanceController.markAttendance);
router.delete('/:id', requireRole('teacher', 'admin'), attendanceController.deleteAttendance);
router.get('/:date', requireRole('teacher', 'admin'), attendanceController.getAttendanceByDate);

module.exports = router;