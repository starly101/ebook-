import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/student', dashboardController.getStudentDashboard);
router.get('/admin', requireAdmin, dashboardController.getAdminDashboard);
router.get('/admin/content-health', requireAdmin, dashboardController.getContentHealth);

export default router;
