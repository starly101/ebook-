import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public routes
router.get('/', apiLimiter, bookController.getBooks);
router.get('/:id', apiLimiter, bookController.getBook);
router.get('/slug/:slug', apiLimiter, bookController.getBookBySlug);
router.get('/:id/chapters', apiLimiter, bookController.getBookChapters);

// Admin routes
router.post('/', requireAdmin, bookController.createBook);
router.put('/:id', requireAdmin, bookController.updateBook);
router.delete('/:id', requireAdmin, bookController.deleteBook);

export default router;
