import { Router } from 'express';
import { getListings, getListingById, createListing, reserveListing, cancelReservation } from '../controllers/listingController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', authenticate, createListing);
router.post('/:id/reserve', authenticate, reserveListing);
router.post('/:id/cancel-reservation', authenticate, cancelReservation);

export default router;
