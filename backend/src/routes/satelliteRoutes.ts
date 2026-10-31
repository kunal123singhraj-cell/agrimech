import { Router } from 'express';
import { SatelliteController } from '../controllers/satelliteController';

const router = Router();

// GET /api/satellite/regions - List regions with filters
router.get('/regions', SatelliteController.getRegions);

// GET /api/satellite/crops - Configurable agronomic parameters (Yield, RPR, CAF)
router.get('/crops', SatelliteController.getCropParameters);

// GET /api/satellite/regions/:id - Region details by ID
router.get('/regions/:id', SatelliteController.getRegionById);

// POST /api/satellite/calculate - Interactive residue calculator
router.post('/calculate', SatelliteController.calculateCustom);

export default router;
