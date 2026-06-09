import { Router } from 'express';
import * as ingestionController from '../controllers/ingestion.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.post('/book', ingestionController.ingestBook);
router.post('/topics/bulk', ingestionController.bulkIngestTopics);
router.get('/stats', ingestionController.getIngestionStats);

export default router;
