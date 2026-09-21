/**
 * teacherRoutes.js
 * Teacher routes — manage own subjects.
 */

const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT AY PROTECTED — teacher only
router.use(verifyToken);
router.use(requireRole('teacher'));

// Subjects
router.get('/subjects', teacherController.getMySubjects);
router.post('/subjects', teacherController.createSubject);
router.put('/subjects/:id', teacherController.updateSubject);
router.delete('/subjects/:id', teacherController.deleteSubject);

// Classes (for dropdown)
router.get('/classes', teacherController.getAllClassesForTeacher);

module.exports = router;