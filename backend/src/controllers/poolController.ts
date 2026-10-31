import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { PoolModel } from '../models/Pool';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const DATA_FILE = path.join(__dirname, '../../data/pools.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readLocalPools(): any[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.warn('[poolController] Error reading local pools cache:', err);
    return [];
  }
}

function writeLocalPools(pools: any[]): void {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(pools, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[poolController] Error writing local pools cache:', err);
  }
}

export const getPools = async (req: Request, res: Response): Promise<void> => {
  try {
    let mongoPools: any[] = [];
    if (mongoose.connection.readyState === 1) {
      try {
        mongoPools = await PoolModel.find().sort({ createdAt: -1 });
      } catch {
        mongoPools = [];
      }
    }

    const localPools = readLocalPools();
    const seenIds = new Set<string>();
    const combined: any[] = [];

    for (const p of localPools) {
      const id = (p._id || p.id || '').toString();
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        combined.push(p);
      }
    }

    for (const p of mongoPools) {
      const plain = p.toObject ? p.toObject() : p;
      const id = (plain._id || plain.id || '').toString();
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        combined.push(plain);
      }
    }

    res.json({ success: true, count: combined.length, data: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const buyerId = req.user?.id || payload.buyerId || ('USR-BUYER-' + Math.floor(100 + Math.random() * 900));
    const buyerName = req.user?.name || payload.buyerOrg || payload.buyerName || 'Industrial Plant';
    const buyerPhone = req.user?.phone || payload.buyerPhone || '+91 98765 00000';
    const buyerOrg = payload.buyerOrg || req.user?.organization || buyerName;
    const residueType = payload.residueType || payload.cropType || 'Agricultural Residue';
    const cropType = payload.cropType || payload.residueType || 'Agricultural Residue';
    const targetTonnes = Number(payload.targetTonnes || payload.totalTonnes || payload.requiredTons || 500);
    const offeredPricePerTonne = Number(payload.offeredPricePerTonne || payload.targetPricePerTon || 2200);
    const district = payload.district || (payload.deliveryLocation ? payload.deliveryLocation.split(',')[0].trim() : 'Local Hub');
    const state = payload.state || (payload.deliveryLocation ? payload.deliveryLocation.split(',')[1]?.trim() || 'National' : 'National');
    const deadline = payload.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const coordinates = payload.coordinates || {
      lat: Number(payload.lat) || 12.6560,
      lng: Number(payload.lng) || 77.4430
    };

    const newPoolData: any = {
      _id: 'POOL-' + Date.now().toString().slice(-6),
      title: payload.title || `${targetTonnes}T ${cropType} Procurement Quota`,
      buyerId,
      buyerName,
      buyerPhone,
      buyerOrg,
      residueType,
      cropType,
      targetTonnes,
      totalTonnes: targetTonnes,
      offeredPricePerTonne,
      district,
      state,
      deliveryLocation: payload.deliveryLocation || `${district}, ${state}`,
      deadline,
      coordinates,
      currentTonnes: 0,
      status: 'open',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally
    const currentPools = readLocalPools();
    currentPools.unshift(newPoolData);
    writeLocalPools(currentPools);

    // Save to Mongo if active
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoSaved = await PoolModel.create(newPoolData);
        newPoolData._id = mongoSaved._id.toString();
      } catch (mongoErr: any) {
        console.warn('[poolController] Note on MongoDB Atlas write:', mongoErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: newPoolData,
      message: 'Bulk procurement demand pool created successfully.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const pledgeToPool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { committedTonnes, agreedPricePerTonne } = req.body;
    const sellerId = req.user?.id || 'USR-FARM';
    const sellerName = req.user?.name || 'Residue Seller';

    const localPools = readLocalPools();
    const targetPool = localPools.find(p => (p._id || p.id) === id);

    const participant = {
      sellerId,
      sellerName,
      committedTonnes: Number(committedTonnes),
      agreedPricePerTonne: Number(agreedPricePerTonne || (targetPool?.offeredPricePerTonne || 2200)),
      joinedAt: new Date().toISOString()
    };

    if (targetPool) {
      if (!Array.isArray(targetPool.participants)) targetPool.participants = [];
      targetPool.participants.push(participant);
      targetPool.currentTonnes = (Number(targetPool.currentTonnes) || 0) + Number(committedTonnes);
      writeLocalPools(localPools);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const pool = await PoolModel.findById(id);
        if (pool) {
          pool.participants.push(participant);
          pool.currentTonnes += Number(committedTonnes);
          await pool.save();
        }
      } catch {
        // silent
      }
    }

    res.json({
      success: true,
      message: `Committed ${committedTonnes} tonnes to pool successfully.`,
      data: targetPool
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

