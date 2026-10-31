import { Router } from 'express';
import {
  getVehicles,
  createVehicle,
  updateVehicleStatus,
  getTransportRequests,
  getTransportBookingById,
  submitQuotation,
  selectQuotation,
  updateLiveTracking,
  submitProofOfDelivery,
  verifyProofOfDelivery
} from '../controllers/transportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Fleet Management
router.get('/vehicles', authenticate, getVehicles);
router.post('/vehicles', authenticate, createVehicle);
router.patch('/vehicles/:id/status', authenticate, updateVehicleStatus);

// Transport Requests & Quotations
router.get('/requests', authenticate, getTransportRequests);
router.get('/requests/:id', authenticate, getTransportBookingById);
router.post('/quotations', authenticate, submitQuotation);
router.post('/select-quotation', authenticate, selectQuotation);

// Delivery Tracking & POD
router.post('/tracking/:id', authenticate, updateLiveTracking);
router.post('/pod/:id', authenticate, submitProofOfDelivery);
router.post('/verify-pod/:id', authenticate, verifyProofOfDelivery);

export default router;
