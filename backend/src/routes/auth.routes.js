import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', requireAuth, authController.getMe);

export default router;
