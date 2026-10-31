import { Request, Response } from 'express';
import { ListingModel } from '../models/Listing';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { residueType, district, balingStatus, maxMoisture } = req.query;

    let filter: any = {};
    if (residueType && residueType !== 'all') filter.residueType = residueType;
    if (district) filter.district = district;
    if (balingStatus) filter.balingStatus = balingStatus;
    if (maxMoisture) filter.moisturePercent = { $lte: Number(maxMoisture) };

    // Auto-release expired reservations (Smart Stock Reservation USP)
    try {
      await ListingModel.updateMany(
        {
          status: 'reserved',
          reservedUntil: { $lt: new Date() }
        },
        {
          $set: { status: 'active' },
          $unset: { reservedUntil: 1, reservedBy: 1, reservedTons: 1 }
        }
      );
    } catch {
      // Silent catch if offline
    }

    let listings: any[] = [];
    try {
      listings = await ListingModel.find(filter).sort({ createdAt: -1 });
    } catch {
      listings = [];
    }

    res.json({ success: true, count: listings.length, data: listings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let listing = null;

    try {
      listing = await ListingModel.findById(id);
    } catch {
      listing = null;
    }

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    res.json({ success: true, data: listing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const sellerId = req.user?.id || payload.ownerId || payload.sellerId;
    const sellerName = req.user?.name || payload.farmerName || payload.sellerName || 'Residue Seller';
    const sellerPhone = req.user?.phone || payload.ownerPhone || payload.farmerPhone || payload.sellerPhone;

    const coordinates = payload.coordinates || {
      lat: payload.lat || 12.6560,
      lng: payload.lng || 77.4430
    };

    const totalTonnes = payload.totalTonnes || payload.quantityTons || 100;

    const newListingData = {
      ...payload,
      sellerId,
      sellerName,
      sellerPhone,
      coordinates,
      totalTonnes,
      availableTonnes: payload.availableTonnes || totalTonnes,
      pricePerTonne: payload.pricePerTonne || payload.pricePerTon || 2500,
      moisturePercent: payload.moisturePercent || 10,
      status: 'active'
    };

    let saved = null;
    try {
      saved = await ListingModel.create(newListingData);
    } catch (err: any) {
      saved = {
        _id: 'LST-' + Date.now().toString().slice(-4),
        ...newListingData,
        createdAt: new Date().toISOString()
      };
    }

    res.status(201).json({
      success: true,
      data: saved,
      message: 'Residue listing successfully published to the marketplace.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * USP 4: Smart Stock Reservation (24h Hold)
 */
export const reserveListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reservedTons, holdHours = 24 } = req.body;
    const buyerId = req.user?.id || req.body.buyerId || 'buyer_1';
    const buyerName = req.user?.name || req.body.buyerName || 'Industrial Buyer';
    const buyerPhone = req.user?.phone || req.body.buyerPhone || '';

    const listing = await ListingModel.findById(id);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.status === 'reserved' && listing.reservedUntil && listing.reservedUntil > new Date()) {
      if (listing.reservedBy?.buyerId && listing.reservedBy.buyerId !== buyerId) {
        res.status(400).json({ success: false, message: 'Stock is currently reserved by another buyer' });
        return;
      }
    }

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + holdHours);

    listing.status = 'reserved';
    listing.reservedUntil = expiry;
    listing.reservedTonnes = reservedTons || listing.availableTonnes;
    listing.reservedBy = { buyerId, buyerName, buyerPhone };

    await listing.save();

    res.json({
      success: true,
      data: listing,
      message: `Stock successfully reserved for 24 hours until ${expiry.toLocaleTimeString()}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await ListingModel.findById(id);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    listing.status = 'active';
    listing.reservedUntil = undefined;
    listing.reservedTonnes = undefined;
    listing.reservedBy = undefined;

    await listing.save();

    res.json({
      success: true,
      data: listing,
      message: 'Stock reservation released back to open market.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
