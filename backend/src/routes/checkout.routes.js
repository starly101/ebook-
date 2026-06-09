import { Router } from 'express';
import * as checkoutController from '../controllers/checkout.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// POST /api/v1/checkout - Initialize checkout (EasyPaisa/JazzCash)
router.post('/', requireAuth, apiLimiter, checkoutController.initializeCheckout);

// GET /api/v1/checkout - Get current subscription status
router.get('/', requireAuth, checkoutController.getSubscription);

export default router;
