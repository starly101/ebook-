import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

const router = Router();

// POST /api/v1/webhooks/payments - EasyPaisa/JazzCash payment webhooks
// NOTE: This route must be registered BEFORE express.json() middleware in app.js
// It uses express.raw() to verify payment signatures
router.post('/payments', webhookController.handlePaymentWebhook);

// GET /api/v1/webhooks/payments - Check webhook status (debugging)
router.get('/payments', webhookController.getWebhookStatus);

export default router;
