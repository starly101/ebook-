import { Router } from 'express';
import * as vaultController from '../controllers/vault.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', vaultController.getVault);
router.get('/stats', vaultController.getVaultStats);
router.post('/:topicId', vaultController.addToVault);
router.delete('/:topicId', vaultController.removeFromVault);
router.get('/:topicId/status', vaultController.checkVaultStatus);

export default router;
