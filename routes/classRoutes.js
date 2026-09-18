/**
 * classRoutes.js
 * Routes para sa classes at subjects queries.
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT NG ROUTES AY PROTECTED
router.use(verifyToken);

// Teacher routes
router.get('/classes/my', requireRole('teacher'), classController.getMyClasses);
router.get('/classes/:classId/subjects', requireRole('teacher'), classController.getSubjectsByClass);

// Student routes
router.get('/subjects/my', requireRole('student'), classController.getMySubjects);

module.exports = router;