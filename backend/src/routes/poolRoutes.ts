import { Router } from 'express';
import { getPools, createPool, pledgeToPool } from '../controllers/poolController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getPools);
router.post('/', authenticate, createPool);
router.post('/:id/pledge', authenticate, pledgeToPool);

export default router;
