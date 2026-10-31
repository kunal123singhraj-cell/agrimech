import { Request, Response } from 'express';
import { PlatformLedgerModel } from '../models/PlatformLedger';
import { UserModel } from '../models/User';
import { OrderModel } from '../models/Order';
import { TransportBookingModel } from '../models/TransportBooking';

// Configurable platform commission rates (Default: 2% residue, 5% transport)
let commissionConfig = {
  residueCommissionPercent: 2.0,
  transportCommissionPercent: 5.0
};

/**
 * Get Platform Revenue Metrics
 * AgriMech earns revenue through ONLY two methods:
 * 1) 2% commission on agricultural residue transactions
 * 2) 5% commission on transportation bookings
 * Platform Revenue = Residue Commissions + Transport Commissions
 */
export const getRevenueMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ledgerEntries = await PlatformLedgerModel.find();
    const orders = await OrderModel.find();
    const transportBookings = await TransportBookingModel.find();

    let totalResidueGMV = 0;
    let totalTransportGMV = 0;
    let totalResidueCommission = 0;
    let totalTransportCommission = 0;
    let totalSupplierDisbursed = 0;
    let totalSupplierPending = 0;
    let total3PLDisbursed = 0;
    let total3PLPending = 0;

    ledgerEntries.forEach(entry => {
      totalResidueGMV += entry.residueGMV || 0;
      totalTransportGMV += entry.transportGMV || 0;
      totalResidueCommission += entry.residueCommissionAmount || 0;
      totalTransportCommission += entry.transportCommissionAmount || 0;

      if (entry.farmerPayoutStatus === 'released') {
        totalSupplierDisbursed += entry.netFarmerPayout || 0;
      } else {
        totalSupplierPending += entry.netFarmerPayout || 0;
      }

      if (entry.transporterPayoutStatus === 'released') {
        total3PLDisbursed += entry.netTransporterPayout || 0;
      } else {
        total3PLPending += entry.netTransporterPayout || 0;
      }
    });

    // If no ledger entries yet in fresh database, calculate from completed orders
    if (ledgerEntries.length === 0 && orders.length > 0) {
      orders.forEach(order => {
        const resCost = order.residueCost || order.totalAmount || 0;
        const transCost = order.transportCost || 0;
        totalResidueGMV += resCost;
        totalTransportGMV += transCost;
        totalResidueCommission += Math.round(resCost * (commissionConfig.residueCommissionPercent / 100));
        totalTransportCommission += Math.round(transCost * (commissionConfig.transportCommissionPercent / 100));
        totalSupplierPending += resCost - Math.round(resCost * 0.02);
        if (transCost > 0) {
          total3PLPending += transCost - Math.round(transCost * 0.05);
        }
      });
    }

    const netAgriMechRevenue = totalResidueCommission + totalTransportCommission;

    res.json({
      success: true,
      data: {
        commissionConfig,
        totalResidueGMV,
        totalTransportGMV,
        totalGrossGMV: totalResidueGMV + totalTransportGMV,
        // Revenue is STRICTLY commissions earned by AgriMech!
        netAgriMechRevenue,
        commissions: {
          residueCommissionEarned: totalResidueCommission,
          residueCommissionRate: `${commissionConfig.residueCommissionPercent}%`,
          transportCommissionEarned: totalTransportCommission,
          transportCommissionRate: `${commissionConfig.transportCommissionPercent}%`
        },
        disbursements: {
          supplierDisbursed: totalSupplierDisbursed,
          supplierPendingInEscrow: totalSupplierPending,
          transporter3PLDisbursed: total3PLDisbursed,
          transporter3PLPendingInEscrow: total3PLPending
        },
        orderCounts: {
          totalOrders: orders.length,
          settledOrders: orders.filter(o => o.status === 'settled').length,
          activeShipments: orders.filter(o => o.status === 'in_transit' || o.status === 'dispatched').length,
          total3PLBookings: transportBookings.length
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Financial Audit Ledger
 */
export const getAuditLedger = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ledger = await PlatformLedgerModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: ledger.length, data: ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get 3PL Partner Approval Queue
 */
export const get3PLPartners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transporters = await UserModel.find({ role: 'transporter' }).sort({ createdAt: -1 });
    res.json({ success: true, count: transporters.length, data: transporters });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Approve or Reject 3PL Partner
 */
export const review3PLPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, approvalStatus } = req.body;
    if (!userId || !approvalStatus) {
      res.status(400).json({ success: false, message: 'User ID and approval status are required' });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { approvalStatus } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: `3PL partner has been ${approvalStatus}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Configurable Commission Rates
 */
export const updateCommissionRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { residueCommissionPercent, transportCommissionPercent } = req.body;
    if (residueCommissionPercent !== undefined) {
      commissionConfig.residueCommissionPercent = Number(residueCommissionPercent);
    }
    if (transportCommissionPercent !== undefined) {
      commissionConfig.transportCommissionPercent = Number(transportCommissionPercent);
    }

    res.json({
      success: true,
      data: commissionConfig,
      message: 'Platform commission rates successfully updated.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
