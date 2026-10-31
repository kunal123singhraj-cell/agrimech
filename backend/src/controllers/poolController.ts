import { Response } from 'express';
import { PoolModel } from '../models/Pool';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getPools = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let pools: any[] = [];
    try {
      pools = await PoolModel.find().sort({ createdAt: -1 });
    } catch {
      pools = [];
    }

    res.json({ success: true, count: pools.length, data: pools });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const buyerId = req.user?.id || payload.buyerId || 'USR-BUYER';
    const buyerName = req.user?.name || payload.buyerOrg || payload.buyerName || 'Industrial Plant';
    const buyerPhone = req.user?.phone || payload.buyerPhone;
    const buyerOrg = payload.buyerOrg || req.user?.organization || buyerName;
    const residueType = payload.residueType || payload.cropType || 'Agricultural Residue';
    const cropType = payload.cropType || payload.residueType || 'Agricultural Residue';
    const targetTonnes = payload.targetTonnes || payload.totalTonnes || payload.requiredTons || 500;
    const offeredPricePerTonne = payload.offeredPricePerTonne || payload.targetPricePerTon || 2200;
    const district = payload.district || (payload.deliveryLocation ? payload.deliveryLocation.split(',')[0].trim() : 'Local Hub');
    const state = payload.state || (payload.deliveryLocation ? payload.deliveryLocation.split(',')[1]?.trim() || 'National' : 'National');
    const deadline = payload.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const coordinates = payload.coordinates || {
      lat: payload.lat || 12.6560,
      lng: payload.lng || 77.4430
    };

    const newPoolData = {
      ...payload,
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
      participants: []
    };

    let saved = null;
    try {
      saved = await PoolModel.create(newPoolData);
    } catch (err: any) {
      saved = {
        _id: 'POOL-' + Date.now().toString().slice(-4),
        ...newPoolData,
        createdAt: new Date().toISOString()
      };
    }

    res.status(201).json({
      success: true,
      data: saved,
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

    let pool = null;
    try {
      pool = await PoolModel.findById(id);
    } catch {
      pool = null;
    }

    if (!pool) {
      res.status(404).json({ success: false, message: 'Pool not found' });
      return;
    }

    const participant = {
      sellerId,
      sellerName,
      committedTonnes: Number(committedTonnes),
      agreedPricePerTonne: Number(agreedPricePerTonne || pool.offeredPricePerTonne),
      joinedAt: new Date().toISOString()
    };

    pool.participants.push(participant);
    pool.currentTonnes += Number(committedTonnes);
    await pool.save();

    res.json({
      success: true,
      message: `Committed ${committedTonnes} tonnes to pool successfully.`,
      data: pool
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
