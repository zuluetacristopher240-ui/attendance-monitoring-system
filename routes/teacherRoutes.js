

const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, requireRole } = require('../middleware/auth');
router.use(verifyToken);
router.use(requireRole('teacher'));
router.get('/subjects', teacherController.getMySubjects);
router.post('/subjects', teacherController.createSubject);
router.put('/subjects/:id', teacherController.updateSubject);
router.delete('/subjects/:id', teacherController.deleteSubject);
router.get('/classes', teacherController.getAllClassesForTeacher);

module.exports = router;