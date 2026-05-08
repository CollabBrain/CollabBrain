const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { apiLimiter } = require('../middlewares/securityMiddleware');

// Route: POST /api/users/register
// Description: Đăng ký tài khoản mới
router.post('/register', apiLimiter, userController.register);

// Route: POST /api/users/login
// Description: Đăng nhập để lấy JWT token
router.post('/login', apiLimiter, userController.login);

// Route: PUT /api/users/profile
// Description: Cập nhật thông tin profile của user (Edit profile)
// Security: Require JWT token, limit rate of requests
router.put('/profile', authMiddleware, apiLimiter, userController.updateProfile);

module.exports = router;
