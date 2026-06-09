import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(aiLimiter);

router.post('/:topicId/explain', aiController.generateExplanation);
router.post('/:topicId/quiz', aiController.generateQuizQuestions);
router.post('/:topicId/flashcards', aiController.generateFlashcards);
router.get('/credits', aiController.checkCredits);

export default router;
