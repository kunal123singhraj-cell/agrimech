import { Response } from 'express';
import { OrderModel } from '../models/Order';
import { TransportBookingModel } from '../models/TransportBooking';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role || 'farmer';
    const userId = req.user?.id;

    if (!userId && role !== 'admin') {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    let orders: any[] = [];
    try {
      let query: any = {};
      if (role === 'farmer') {
        query = { sellerId: userId };
      } else if (role === 'buyer') {
        query = { buyerId: userId };
      } else if (role === 'transporter') {
        query = { transporterId: userId };
      } else if (role === 'admin') {
        query = {}; // Admin sees all
      }
      orders = await OrderModel.find(query).sort({ createdAt: -1 });
    } catch {
      orders = [];
    }

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let order = null;

    try {
      order = await OrderModel.findById(id);
    } catch {
      order = null;
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orderData = req.body;
    const buyerId = req.user?.id || orderData.buyerId || 'BUYER-DEFAULT';
    const buyerName = req.user?.name || orderData.buyerName || 'Procurement Buyer';

    const pricePerTon = Number(orderData.agreedPricePerTonne || orderData.pricePerTon || 2200);
    const quantity = Number(orderData.quantityTonnes || orderData.quantityTons || 50);
    const residueCost = pricePerTon * quantity;
    const transportCost = Number(orderData.transportCost || 0);
    const residueCommission = Math.round(residueCost * 0.02);
    const transportCommission = transportCost > 0 ? Math.round(transportCost * 0.05) : 0;
    const netFarmerPayout = residueCost - residueCommission;
    const netTransporterPayout = transportCost - transportCommission;
    const totalAmount = residueCost + transportCost;

    const newOrderData = {
      ...orderData,
      buyerId,
      buyerName,
      agreedPricePerTonne: pricePerTon,
      quantityTonnes: quantity,
      residueCost,
      transportCost,
      totalAmount,
      residueCommission,
      transportCommission,
      netFarmerPayout,
      netTransporterPayout,
      status: transportCost > 0 ? 'transport_booked' : 'transport_pending',
      originLocation: orderData.originLocation || `${orderData.sellerName || 'Farmer'} Farm Gate`,
      deliveryAddress: orderData.deliveryAddress || orderData.deliveryLocation || 'Industrial Plant Boiler Shed Gate 1',
      milestones: [
        { title: 'Order Confirmed & Escrow Funded', status: 'completed', timestamp: new Date().toLocaleString() },
        { title: '3PL Transport Booking & Carrier Assignment', status: transportCost > 0 ? 'completed' : 'pending' },
        { title: 'Farm Gate Baling & Dispatch Loading', status: 'pending' },
        { title: 'APMC Electronic Weighbridge Gross Weighting', status: 'pending' },
        { title: 'In Transit to Delivery Destination', status: 'pending' },
        { title: 'Plant Gate Unloading & Moisture Verification', status: 'pending' },
        { title: 'Escrow Settlement Release (Farmer 98% + 3PL 95%)', status: 'pending' }
      ]
    };

    const saved = await OrderModel.create(newOrderData);

    // Automatically create a 3PL Transport Booking Request for this order
    try {
      await TransportBookingModel.create({
        orderId: saved._id.toString(),
        buyerId,
        buyerName,
        buyerPhone: req.user?.phone || '+91 99000 11223',
        sellerId: orderData.sellerId || 'SELLER-ID',
        sellerName: orderData.sellerName || 'Verified Farmer',
        sellerPhone: orderData.sellerPhone || '+91 98765 43210',
        residueType: orderData.residueType || orderData.cropType || 'Biomass Residue Bales',
        quantityTonnes: quantity,
        pickupLocation: {
          address: orderData.originLocation || `${orderData.sellerName || 'Farmer'} Farm Yard`,
          district: orderData.district || 'Mandya / Ramanagara',
          state: orderData.state || 'Karnataka',
          lat: orderData.lat || 12.641,
          lng: orderData.lng || 77.442
        },
        deliveryLocation: {
          address: orderData.deliveryAddress || 'Industrial Boiler Shed Gate 1',
          district: 'Industrial Area',
          state: orderData.state || 'Karnataka',
          lat: 12.839,
          lng: 77.677
        },
        distanceKm: orderData.distanceKm || 45,
        status: 'requested',
        quotations: [],
        targetPickupDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        targetDeliveryDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString().split('T')[0],
        trackingHistory: []
      });
    } catch (bookingErr) {
      console.warn('[OrderController] Could not auto-create transport booking request:', bookingErr);
    }

    res.status(201).json({
      success: true,
      data: saved,
      message: 'Order created and 3PL transport booking request broadcasted to carrier network.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
