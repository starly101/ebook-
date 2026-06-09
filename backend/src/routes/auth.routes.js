import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/signup', authLimiter, authController.signup);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/google', authLimiter, authController.googleAuth);

// Token refresh (public but rate limited)
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', requireAuth, authController.getMe);
router.post('/onboarding', requireAuth, authController.completeOnboarding);

// Logout (works with or without auth)
router.all('/logout', authController.logout);

export default router;
