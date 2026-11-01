

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, requireRole } = require('../middleware/auth');
router.use(verifyToken);
router.get('/classes/my', requireRole('teacher'), classController.getMyClasses);
router.get('/classes/:classId/subjects', requireRole('teacher'), classController.getSubjectsByClass);
router.get('/subjects/my', requireRole('student'), classController.getMySubjects);
router.get('/subjects/:subjectId/active-session', requireRole('student'), classController.getActiveSession);

module.exports = router;