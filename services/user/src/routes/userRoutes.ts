import { Router } from 'express';
import {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  getProfile
} from '../handlers/userHandler';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authenticateToken); // Apply authentication middleware to all routes below
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router; 