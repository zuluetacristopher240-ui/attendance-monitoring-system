const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT NG ROUTES AY PROTECTED (kailangan ng token)
router.use(verifyToken);

// ✅ Admin lang ang pwedeng mag-CRUD ng students
router.get('/', requireRole('admin', 'teacher'), studentController.getAllStudents);
router.get('/:id', requireRole('admin', 'teacher'), studentController.getStudentById);
router.post('/', requireRole('admin'), studentController.createStudent);
router.put('/:id', requireRole('admin'), studentController.updateStudent);
router.delete('/:id', requireRole('admin'), studentController.deleteStudent);

module.exports = router;