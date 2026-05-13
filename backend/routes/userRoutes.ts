import express from 'express';
import { register, login, updateProfile } from '../controllers/userController';
import authMiddleware from '../middlewares/authMiddleware';
import { apiLimiter } from '../middlewares/securityMiddleware';

const router = express.Router();

// Route: POST /api/users/register
// Description: Đăng ký tài khoản mới
router.post('/register', apiLimiter, register);

// Route: POST /api/users/login
// Description: Đăng nhập để lấy JWT token
router.post('/login', apiLimiter, login);

// Route: PUT /api/users/profile
// Description: Cập nhật thông tin profile của user (Edit profile)
// Security: Require JWT token, limit rate of requests
router.put('/profile', authMiddleware, apiLimiter, updateProfile);

export default router;
