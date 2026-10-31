import { Router, Request, Response } from 'express';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  switchRole,
  sendOtp,
  verifyOtp,
  completeRegistration,
  updateLanguage
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Standard Password & Token Auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getCurrentUser);
router.post('/switch-role', authenticate, switchRole);
router.post('/update-language', authenticate, updateLanguage);

// Real Mobile Number + SMS OTP Authentication
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-registration', completeRegistration);

// Admin / User Purge: Wipe out all fake & mock data
router.post('/purge-all-data', async (_req: Request, res: Response) => {
  try {
    const { purgeAllCollections } = await import('../config/db');
    await purgeAllCollections();
    res.json({ success: true, message: 'All mock & seed records have been purged from database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
