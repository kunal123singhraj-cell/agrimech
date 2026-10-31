import { Router } from 'express';
import { getOrders, getOrderById, createOrder } from '../controllers/orderController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getOrders);
router.get('/:id', optionalAuthenticate, getOrderById);
router.post('/', authenticate, createOrder);

export default router;
