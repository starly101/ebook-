import { Router } from 'express';
import * as progressController from '../controllers/progress.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/stats', progressController.getProgressStats);
router.get('/recent', progressController.getRecentActivity);
router.get('/streak', progressController.getStreakData);
router.get('/:topicId', progressController.getTopicProgress);
router.put('/:topicId', progressController.updateProgress);
router.post('/:topicId/complete', progressController.completeTopic);

export default router;
