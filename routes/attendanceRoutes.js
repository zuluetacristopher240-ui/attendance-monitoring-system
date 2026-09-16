const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/stats/today', attendanceController.getTodayStats);
router.get('/summary/report', attendanceController.getAttendanceSummary);
router.get('/my/:userId', attendanceController.getMyAttendance);
router.post('/generate-code', attendanceController.generateCode);
router.post('/check-in', attendanceController.checkIn);
router.get('/:date', attendanceController.getAttendanceByDate);
router.post('/', attendanceController.markAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;