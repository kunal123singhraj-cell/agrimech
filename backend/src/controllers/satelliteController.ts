import { Request, Response } from 'express';
import { 
  satelliteEstimationService, 
  CROP_PARAMETERS 
} from '../services/satelliteEstimationService';

export class SatelliteController {
  /**
   * GET /api/satellite/regions
   * Fetches all monitored agricultural regions with optional query filters.
   */
  public static getRegions(req: Request, res: Response): void {
    try {
      const { 
        district, 
        crop, 
        availabilityLevel, 
        harvestStatus, 
        minTonnes, 
        query 
      } = req.query;

      const filters = {
        district: district as string | undefined,
        crop: crop as string | undefined,
        availabilityLevel: availabilityLevel as string | undefined,
        harvestStatus: harvestStatus as string | undefined,
        minTonnes: minTonnes ? Number(minTonnes) : undefined,
        query: query as string | undefined
      };

      const regions = satelliteEstimationService.getAllRegions(filters);
      const metrics = satelliteEstimationService.getAggregateMetrics();

      res.json({
        success: true,
        data: regions,
        metrics,
        meta: {
          totalReturned: regions.length,
          dataMode: 'DEMO_ESTIMATE',
          satelliteSource: 'Copernicus Sentinel-2 MSI Multi-Spectral Instrument (Level-2A BOA)',
          processingPipeline: 'AgriMech Crop Canopy & Biomass Estimation Engine v1.0',
          notice: 'Estimations are derived from spectral vegetation indices and agro-climatic yield models. physical farm-gate inspections recommended prior to contracting.'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve satellite supply regions',
        error: error.message
      });
    }
  }

  /**
   * GET /api/satellite/regions/:id
   * Fetches detailed data for a specific region.
   */
  public static getRegionById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const region = satelliteEstimationService.getRegionById(id);

      if (!region) {
        res.status(404).json({
          success: false,
          message: `Satellite region with ID ${id} not found`
        });
        return;
      }

      res.json({
        success: true,
        data: region
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve region details',
        error: error.message
      });
    }
  }

  /**
   * GET /api/satellite/crops
   * Returns list of configured crops and their estimation parameters (Yield, RPR, CAF).
   */
  public static getCropParameters(_req: Request, res: Response): void {
    try {
      res.json({
        success: true,
        data: CROP_PARAMETERS
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve crop parameters',
        error: error.message
      });
    }
  }

  /**
   * POST /api/satellite/calculate
   * Interactive calculator endpoint for custom crop area and parameters.
   */
  public static calculateCustom(req: Request, res: Response): void {
    try {
      const { areaHectares, cropKey, customYield, customRpr, customCaf } = req.body;

      if (!areaHectares || !cropKey) {
        res.status(400).json({
          success: false,
          message: 'areaHectares and cropKey are required parameters'
        });
        return;
      }

      const calculation = satelliteEstimationService.calculateCustomResidue({
        areaHectares: Number(areaHectares),
        cropKey: String(cropKey),
        customYield: customYield !== undefined ? Number(customYield) : undefined,
        customRpr: customRpr !== undefined ? Number(customRpr) : undefined,
        customCaf: customCaf !== undefined ? Number(customCaf) : undefined
      });

      res.json({
        success: true,
        data: calculation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Calculation error',
        error: error.message
      });
    }
  }
}
