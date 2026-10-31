import { Router } from 'express';
import {
  getNegotiationThreads,
  getNegotiationById,
  sendNegotiationMessage
} from '../controllers/negotiationController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getNegotiationThreads);
router.get('/:id', optionalAuthenticate, getNegotiationById);
router.post('/:id/messages', authenticate, sendNegotiationMessage);

export default router;
