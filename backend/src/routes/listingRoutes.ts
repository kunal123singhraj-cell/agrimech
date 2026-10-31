import { Router } from 'express';
import { getListings, getListingById, createListing, reserveListing, cancelReservation, deleteListing } from '../controllers/listingController';
import { optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', optionalAuthenticate, createListing);
router.post('/:id/reserve', optionalAuthenticate, reserveListing);
router.post('/:id/cancel-reservation', optionalAuthenticate, cancelReservation);
router.delete('/:id', optionalAuthenticate, deleteListing);

export default router;

