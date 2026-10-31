import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getDigitalReceipt
} from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/receipt/:orderId', authenticate, getDigitalReceipt);

export default router;
