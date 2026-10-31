import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { VehicleModel } from '../models/Vehicle';
import { TransportBookingModel } from '../models/TransportBooking';
import { OrderModel } from '../models/Order';
import { PlatformLedgerModel } from '../models/PlatformLedger';

// ----------------------------------------------------
// 3PL FLEET MANAGEMENT
// ----------------------------------------------------

export const getVehicles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transporterId = req.user?.id;
    if (!transporterId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const vehicles = await VehicleModel.find({ transporterId }).sort({ createdAt: -1 });
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createVehicle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transporterId = req.user?.id;
    const transporterName = req.user?.name || '3PL Logistics Company';

    if (!transporterId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      registrationNumber,
      vehicleType,
      capacityTonnes,
      driverName,
      driverPhone,
      driverLicense,
      baseLocation,
      operatingStates
    } = req.body;

    if (!registrationNumber || !vehicleType || !capacityTonnes || !driverName || !driverPhone) {
      res.status(400).json({ success: false, message: 'Missing required vehicle or driver details.' });
      return;
    }

    const typeNames: Record<string, string> = {
      pickup_3t: 'Pick-Up Truck (3T)',
      eicher_8t: 'Eicher Medium Hauler (8T)',
      taurus_16t: 'Heavy 6-Wheeler Taurus (16T)',
      trailer_28t: 'Multi-Axle Trailer (28T)'
    };

    const newVehicle = await VehicleModel.create({
      transporterId,
      transporterName,
      registrationNumber: registrationNumber.toUpperCase().trim(),
      vehicleType,
      vehicleTypeName: typeNames[vehicleType] || 'Commercial Carrier',
      capacityTonnes: Number(capacityTonnes),
      driverName,
      driverPhone,
      driverLicense: driverLicense || 'DL-PENDING',
      status: 'available',
      baseLocation: baseLocation || 'Local Transport Hub',
      operatingStates: operatingStates || ['Karnataka', 'Tamil Nadu', 'Haryana', 'Punjab', 'Maharashtra']
    });

    res.status(201).json({ success: true, data: newVehicle, message: 'Vehicle successfully added to your 3PL fleet.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateVehicleStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, driverName, driverPhone } = req.body;

    const vehicle = await VehicleModel.findByIdAndUpdate(
      id,
      { $set: { status, ...(driverName && { driverName }), ...(driverPhone && { driverPhone }) } },
      { new: true }
    );

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    res.json({ success: true, data: vehicle, message: 'Vehicle status updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------
// TRANSPORT BOOKING REQUESTS & QUOTATIONS
// ----------------------------------------------------

export const getTransportRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const requests = await TransportBookingModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTransportBookingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await TransportBookingModel.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Transport booking request not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3PL Partner Submits a Transportation Quotation
 */
export const submitQuotation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transporterId = req.user?.id;
    const transporterName = req.user?.name || req.body.transporterName || '3PL Logistics Company';
    const transporterPhone = req.user?.phone || req.body.transporterPhone || '+91 98000 00000';

    const {
      bookingId,
      vehicleType,
      vehicleCapacityTonnes,
      vehicleRegistrationNumber,
      driverName,
      driverPhone,
      quoteAmount,
      breakdown,
      estimatedDays,
      notes
    } = req.body;

    if (!bookingId || !quoteAmount || !vehicleType) {
      res.status(400).json({ success: false, message: 'Missing required quotation details.' });
      return;
    }

    const booking = await TransportBookingModel.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Transport booking request not found.' });
      return;
    }

    const quotationId = `QUO-${Date.now().toString().slice(-6)}`;
    const newQuotation = {
      id: quotationId,
      transporterId: transporterId || `3PL-${Date.now().toString().slice(-4)}`,
      transporterName,
      transporterPhone,
      transporterRating: 4.9,
      vehicleType,
      vehicleCapacityTonnes: Number(vehicleCapacityTonnes || 16),
      vehicleRegistrationNumber,
      driverName,
      driverPhone,
      quoteAmount: Number(quoteAmount),
      breakdown: breakdown || {
        baseFreight: Math.round(Number(quoteAmount) * 0.75),
        fuelSurcharge: Math.round(Number(quoteAmount) * 0.12),
        tolls: Math.round(Number(quoteAmount) * 0.08),
        loadingUnloadingHandling: Math.round(Number(quoteAmount) * 0.05)
      },
      estimatedDays: Number(estimatedDays || 2),
      validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
      notes
    };

    booking.quotations.push(newQuotation);
    if (booking.status === 'requested') {
      booking.status = 'quoted';
    }
    await booking.save();

    res.status(201).json({
      success: true,
      data: newQuotation,
      message: 'Transportation quotation successfully submitted to industrial buyer.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Buyer Selects and Approves Preferred 3PL Quotation
 * Locks the agreed transportation price separately from residue price.
 */
export const selectQuotation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, quotationId } = req.body;

    const booking = await TransportBookingModel.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    const quote = booking.quotations.find(q => q.id === quotationId);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Selected quotation not found in this request.' });
      return;
    }

    // Mark quotation accepted, reject others
    booking.quotations.forEach(q => {
      if (q.id === quotationId) {
        q.status = 'accepted';
      } else {
        q.status = 'rejected';
      }
    });

    booking.selectedQuotationId = quotationId;
    booking.agreedTransportCost = quote.quoteAmount;
    booking.assignedTransporterId = quote.transporterId;
    booking.assignedTransporterName = quote.transporterName;
    booking.assignedVehicleNumber = quote.vehicleRegistrationNumber || 'Assigned on Dispatch';
    booking.assignedDriverName = quote.driverName || 'Designated 3PL Driver';
    booking.assignedDriverPhone = quote.driverPhone || quote.transporterPhone;
    booking.status = 'booked';
    await booking.save();

    // Synchronize with the Order: Lock transportation cost into order summary
    const order = await OrderModel.findById(booking.orderId);
    if (order) {
      order.transportBookingId = booking._id.toString();
      order.transporterId = quote.transporterId;
      order.transporterName = quote.transporterName;
      order.transportCost = quote.quoteAmount;
      order.totalAmount = order.residueCost + quote.quoteAmount;
      order.transportCommission = Math.round(quote.quoteAmount * 0.05); // 5% AgriMech commission
      order.netTransporterPayout = quote.quoteAmount - order.transportCommission; // 95% to 3PL
      order.truckNumber = quote.vehicleRegistrationNumber;
      order.driverName = quote.driverName;
      order.driverPhone = quote.driverPhone;
      order.status = 'transport_booked';
      await order.save();
    }

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        agreedTransportCost: quote.quoteAmount,
        transporterName: quote.transporterName,
        status: 'booked'
      },
      message: 'Transportation quotation approved! Transport price locked into order summary.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3PL Dispatches Vehicle & Updates Live GPS Location
 */
export const updateLiveTracking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lat, lng, locationName, statusNote, status } = req.body;

    const booking = await TransportBookingModel.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Transport booking not found' });
      return;
    }

    if (lat && lng) {
      booking.trackingHistory.push({
        lat: Number(lat),
        lng: Number(lng),
        locationName: locationName || 'Highway Segment',
        timestamp: new Date().toISOString(),
        statusNote: statusNote || 'In transit'
      });
    }

    if (status) {
      booking.status = status;
      if (status === 'dispatched' && !booking.actualPickupDate) {
        booking.actualPickupDate = new Date().toISOString();
      }
      if (status === 'delivered' && !booking.actualDeliveryDate) {
        booking.actualDeliveryDate = new Date().toISOString();
      }
    }

    await booking.save();

    // Update order status if dispatched or delivered
    if (status) {
      await OrderModel.findByIdAndUpdate(booking.orderId, {
        $set: { status: status === 'delivered' ? 'delivered' : 'in_transit' }
      });
    }

    res.json({ success: true, data: booking, message: 'Tracking position and delivery milestone updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3PL Submits Proof of Delivery (POD)
 */
export const submitProofOfDelivery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { slipNumber, weighbridgeGrossTonnes, weighbridgeTareTonnes, documentUrl, receiverNotes } = req.body;

    if (!slipNumber || !weighbridgeGrossTonnes || !weighbridgeTareTonnes) {
      res.status(400).json({ success: false, message: 'Weighbridge slip number and gross/tare weights are required.' });
      return;
    }

    const netWeight = Number(weighbridgeGrossTonnes) - Number(weighbridgeTareTonnes);

    const booking = await TransportBookingModel.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Transport booking not found' });
      return;
    }

    booking.proofOfDelivery = {
      slipNumber,
      weighbridgeGrossTonnes: Number(weighbridgeGrossTonnes),
      weighbridgeTareTonnes: Number(weighbridgeTareTonnes),
      netWeightTonnes: Math.round(netWeight * 100) / 100,
      documentUrl,
      verifiedByBuyer: false,
      receiverNotes
    };
    booking.status = 'delivered';
    await booking.save();

    await OrderModel.findByIdAndUpdate(booking.orderId, {
      $set: {
        proofOfDeliverySlip: slipNumber,
        weighbridgeWeightTonnes: netWeight,
        status: 'weighbridge_verified'
      }
    });

    res.json({
      success: true,
      data: booking.proofOfDelivery,
      message: 'Proof of Delivery (POD) submitted. Awaiting industrial buyer sign-off for payout disbursement.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Buyer Verifies POD: Releases Farmer 98% and 3PL 95% Escrow Payouts
 */
export const verifyProofOfDelivery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await TransportBookingModel.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Transport booking not found' });
      return;
    }

    if (!booking.proofOfDelivery) {
      res.status(400).json({ success: false, message: 'No Proof of Delivery (POD) has been uploaded yet.' });
      return;
    }

    booking.proofOfDelivery.verifiedByBuyer = true;
    booking.proofOfDelivery.verifiedAt = new Date().toISOString();
    booking.status = 'pod_verified';
    await booking.save();

    // Release Escrow Payouts in Order and Ledger
    const order = await OrderModel.findById(booking.orderId);
    if (order) {
      order.status = 'settled';
      order.payoutStatus = {
        farmer: 'released',
        transporter: 'released'
      };
      await order.save();

      // Update financial audit ledger
      await PlatformLedgerModel.findOneAndUpdate(
        { orderId: order._id.toString() },
        {
          $set: {
            farmerPayoutStatus: 'released',
            transporterPayoutStatus: 'released',
            status: 'settled'
          }
        }
      );
    }

    res.json({
      success: true,
      data: {
        orderId: booking.orderId,
        farmerPayout: 'released (98%)',
        transporterPayout: 'released (95%)',
        status: 'settled'
      },
      message: 'Proof of Delivery verified! Both farmer (98%) and 3PL transporter (95%) payouts have been released.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
