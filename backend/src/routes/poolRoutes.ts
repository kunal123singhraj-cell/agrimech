import { Router } from 'express';
import { getPools, createPool, pledgeToPool } from '../controllers/poolController';
import { optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getPools);
router.post('/', optionalAuthenticate, createPool);
router.post('/:id/pledge', optionalAuthenticate, pledgeToPool);

export default router;

