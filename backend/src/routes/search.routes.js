import { Router } from 'express';
import * as searchController from '../controllers/search.controller.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', apiLimiter, searchController.globalSearch);
router.get('/filtered', apiLimiter, searchController.searchWithFilters);
router.get('/suggestions', apiLimiter, searchController.getSearchSuggestions);

export default router;
