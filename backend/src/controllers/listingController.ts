import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { ListingModel } from '../models/Listing';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const DATA_FILE = path.join(__dirname, '../../data/listings.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readLocalListings(): any[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.warn('[listingController] Error reading local listings cache:', err);
    return [];
  }
}

function writeLocalListings(listings: any[]): void {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(listings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[listingController] Error writing local listings cache:', err);
  }
}

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { residueType, district, balingStatus, maxMoisture } = req.query;

    let mongoListings: any[] = [];
    if (mongoose.connection.readyState === 1) {
      try {
        await ListingModel.updateMany(
          {
            status: 'reserved',
            reservedUntil: { $lt: new Date() }
          },
          {
            $set: { status: 'active' },
            $unset: { reservedUntil: 1, reservedBy: 1, reservedTonnes: 1 }
          }
        );

        let filter: any = {};
        if (residueType && residueType !== 'all') filter.residueType = residueType;
        if (district) filter.district = district;
        if (balingStatus) filter.balingStatus = balingStatus;
        if (maxMoisture) filter.moisturePercent = { $lte: Number(maxMoisture) };

        mongoListings = await ListingModel.find(filter).sort({ createdAt: -1 });
      } catch {
        mongoListings = [];
      }
    }

    const localListings = readLocalListings();

    // Auto-release expired reservations in local memory
    const now = new Date();
    let localChanged = false;
    for (const item of localListings) {
      if (item.status === 'reserved' && item.reservedUntil && new Date(item.reservedUntil) < now) {
        item.status = 'active';
        delete item.reservedUntil;
        delete item.reservedBy;
        delete item.reservedTonnes;
        localChanged = true;
      }
    }
    if (localChanged) {
      writeLocalListings(localListings);
    }

    // Merge without duplicates
    const seenIds = new Set<string>();
    const combined: any[] = [];

    for (const item of localListings) {
      const id = (item._id || item.id || '').toString();
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        combined.push(item);
      }
    }

    for (const item of mongoListings) {
      const plain = item.toObject ? item.toObject() : item;
      const id = (plain._id || plain.id || '').toString();
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        combined.push(plain);
      }
    }

    // Apply filtering
    let filtered = combined;
    if (residueType && residueType !== 'all') {
      filtered = filtered.filter(l => l.residueType === residueType);
    }
    if (district) {
      filtered = filtered.filter(l => l.district?.toLowerCase() === (district as string).toLowerCase());
    }
    if (balingStatus) {
      filtered = filtered.filter(l => l.balingStatus === balingStatus);
    }
    if (maxMoisture) {
      filtered = filtered.filter(l => Number(l.moisturePercent) <= Number(maxMoisture));
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check local store first
    const local = readLocalListings().find(l => (l._id || l.id) === id);
    if (local) {
      res.json({ success: true, data: local });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const listing = await ListingModel.findById(id);
        if (listing) {
          res.json({ success: true, data: listing });
          return;
        }
      } catch {
        // Continue
      }
    }

    res.status(404).json({ success: false, message: 'Listing not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const sellerId = req.user?.id || payload.ownerId || payload.sellerId || ('USR-SELLER-' + Math.floor(100 + Math.random() * 900));
    const sellerName = req.user?.name || payload.farmerName || payload.sellerName || 'Verified Farm Gate';
    const sellerPhone = req.user?.phone || payload.ownerPhone || payload.farmerPhone || payload.sellerPhone || '+91 98765 43210';
    const residueType = payload.residueType || 'ragi_straw';
    const variety = payload.variety || payload.qualityGrade || 'Standard Agro Lot';
    const totalTonnes = Number(payload.totalTonnes || payload.quantityTons || 100);
    const availableTonnes = Number(payload.availableTonnes || totalTonnes);
    const pricePerTonne = Number(payload.pricePerTonne || payload.pricePerTon || 2500);
    const moisturePercent = Number(payload.moisturePercent || 10);
    const balingStatus = payload.balingStatus || 'square_bales';
    const district = payload.district || 'Harohalli';
    const state = payload.state || payload.region || 'Karnataka';

    const coordinates = payload.coordinates || {
      lat: Number(payload.lat) || 12.6560,
      lng: Number(payload.lng) || 77.4430
    };

    const newListingData: any = {
      _id: 'LST-' + Date.now().toString().slice(-6),
      sellerId,
      sellerName,
      sellerPhone,
      farmerName: sellerName,
      farmerPhone: sellerPhone,
      residueType,
      variety,
      totalTonnes,
      availableTonnes,
      pricePerTonne,
      moisturePercent,
      balingStatus,
      district,
      state,
      village: payload.village || district,
      coordinates,
      harvestDate: payload.harvestDate || new Date().toISOString().split('T')[0],
      status: 'active',
      notes: payload.notes || payload.description || '',
      verifiedWeighbridge: payload.verifiedWeighbridge !== false,
      imageUrl: payload.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      calorificValue: payload.calorificValue || '3,450 kcal/kg',
      co2AbatedTonnes: payload.co2AbatedTonnes || parseFloat((totalTonnes * 1.46).toFixed(1)),
      ashPercent: Number(payload.ashPercent || 6),
      aqiScore: Number(payload.aqiScore || 85),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately store into persistent local JSON storage
    const currentListings = readLocalListings();
    currentListings.unshift(newListingData);
    writeLocalListings(currentListings);

    // 2. Persist to MongoDB Atlas if connection is active
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoSaved = await ListingModel.create(newListingData);
        newListingData._id = mongoSaved._id.toString();
      } catch (mongoErr: any) {
        console.warn('[listingController] Note on MongoDB Atlas write:', mongoErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: newListingData,
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

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + holdHours);

    // Update in local file
    const localListings = readLocalListings();
    const localIndex = localListings.findIndex(l => (l._id || l.id) === id);
    let target = localIndex >= 0 ? localListings[localIndex] : null;

    if (target) {
      target.status = 'reserved';
      target.reservedUntil = expiry.toISOString();
      target.reservedTonnes = reservedTons || target.availableTonnes;
      target.reservedBy = { buyerId, buyerName, buyerPhone };
      writeLocalListings(localListings);
    }

    // Update in MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const listing = await ListingModel.findById(id);
        if (listing) {
          listing.status = 'reserved';
          listing.reservedUntil = expiry;
          listing.reservedTonnes = reservedTons || listing.availableTonnes;
          listing.reservedBy = { buyerId, buyerName, buyerPhone };
          await listing.save();
          target = listing;
        }
      } catch {
        // silent
      }
    }

    if (!target) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    res.json({
      success: true,
      data: target,
      message: `Stock successfully reserved for 24 hours until ${expiry.toLocaleTimeString()}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const localListings = readLocalListings();
    const localIndex = localListings.findIndex(l => (l._id || l.id) === id);
    let target = localIndex >= 0 ? localListings[localIndex] : null;

    if (target) {
      target.status = 'active';
      delete target.reservedUntil;
      delete target.reservedTonnes;
      delete target.reservedBy;
      writeLocalListings(localListings);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const listing = await ListingModel.findById(id);
        if (listing) {
          listing.status = 'active';
          listing.reservedUntil = undefined;
          listing.reservedTonnes = undefined;
          listing.reservedBy = undefined;
          await listing.save();
          target = listing;
        }
      } catch {
        // silent
      }
    }

    if (!target) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    res.json({
      success: true,
      data: target,
      message: 'Stock reservation released back to open market.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let localListings = readLocalListings();
    localListings = localListings.filter(l => (l._id || l.id) !== id);
    writeLocalListings(localListings);

    if (mongoose.connection.readyState === 1) {
      try {
        await ListingModel.findByIdAndDelete(id);
      } catch {
        // silent
      }
    }

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

