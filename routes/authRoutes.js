const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ PUBLIC ROUTES — hindi kailangan ng token
// (Login at Register lang ang walang auth)

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;