import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Public routes
router.get('/:id', quizController.getQuiz);
router.get('/topic/:topicId', quizController.getQuizzesByTopic);
router.get('/topic/:topicId/random', quizController.getRandomQuiz);

// Authenticated routes
router.post('/:id/submit', requireAuth, quizController.submitQuiz);

// Admin routes
router.post('/', requireAdmin, quizController.createQuiz);

export default router;
