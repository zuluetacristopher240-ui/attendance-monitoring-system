/**
 * adminRoutes.js
 * Admin routes — classes at subjects CRUD.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ LAHAT AY PROTECTED — admin only
router.use(verifyToken);
router.use(requireRole('admin'));

// Classes
router.get('/classes', adminController.getAllClasses);
router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);

// Teachers (for dropdown)
router.get('/teachers', adminController.getAllTeachers);

// Subjects
router.get('/subjects', adminController.getAllSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

module.exports = router;