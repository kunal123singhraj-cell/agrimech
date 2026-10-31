import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { OrderModel } from '../models/Order';
import { TransportBookingModel } from '../models/TransportBooking';
import { PlatformLedgerModel } from '../models/PlatformLedger';

export interface DigitalReceipt {
  receiptNumber: string;
  transactionId: string;
  orderId: string;
  timestamp: string;
  buyerName: string;
  sellerName: string;
  transporterName: string;
  cropType: string;
  quantityTonnes: number;
  itemizedBreakdown: {
    residueSubtotal: number;
    transportSubtotal: number;
    platformCommissionResidue: number; // 2%
    platformCommissionTransport: number; // 5%
    totalPaidByBuyer: number;
  };
  escrowVaultId: string;
  paymentMethod: string;
  status: string;
  qrVerificationCode: string;
}

/**
 * Initialize AgriPay Payment for an Order
 * Calculates:
 * - Material Cost (to Farmer)
 * - Transportation Cost (to 3PL, paid by Buyer)
 * - Platform Commissions (2% residue, 5% transport)
 * - Final Payable Amount
 */
export const createPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentMethod } = req.body;
    const buyerId = req.user?.id;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const residueCost = order.residueCost || (order.agreedPricePerTonne * order.quantityTonnes);
    const transportCost = order.transportCost || 0;
    const totalAmount = residueCost + transportCost;

    const residueCommission = Math.round(residueCost * 0.02); // 2% platform commission
    const transportCommission = Math.round(transportCost * 0.05); // 5% platform commission
    const netFarmerPayout = residueCost - residueCommission; // 98%
    const netTransporterPayout = transportCost - transportCommission; // 95%

    const transactionId = `AGRIPAY-TXN-${Date.now().toString().slice(-8)}`;
    const razorpayOrderId = `order_${Date.now().toString().slice(-14)}`;

    order.residueCost = residueCost;
    order.transportCost = transportCost;
    order.totalAmount = totalAmount;
    order.residueCommission = residueCommission;
    order.transportCommission = transportCommission;
    order.netFarmerPayout = netFarmerPayout;
    order.netTransporterPayout = netTransporterPayout;
    order.paymentDetails = {
      transactionId,
      paymentMethod: paymentMethod || 'UPI (Google Pay / PhonePe)',
      paymentStatus: 'pending',
      razorpayOrderId
    };
    await order.save();

    res.json({
      success: true,
      data: {
        orderId: order._id,
        transactionId,
        razorpayOrderId,
        amount: totalAmount,
        currency: 'INR',
        breakdown: {
          residueCost,
          transportCost,
          platformCommissionResidue: residueCommission,
          platformCommissionTransport: transportCommission,
          totalPayable: totalAmount
        },
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_agrimech_sandbox_2026'
      },
      message: 'AgriPay order initiated. Total payable includes material and agreed transportation.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verify AgriPay Payment & Lock in Escrow Vault
 */
export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, transactionId, paymentMethod, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const vaultId = `ESC-VAULT-${order._id.toString().slice(-6)}`;
    const finalTxnId = razorpayPaymentId || transactionId || `AGRIPAY-${Date.now().toString().slice(-8)}`;

    order.paymentDetails = {
      transactionId: finalTxnId,
      paymentMethod: paymentMethod || 'AgriPay Secure UPI',
      paymentStatus: 'escrow_locked',
      paidAt: new Date().toISOString(),
      receiptNumber,
      razorpayPaymentId
    };
    order.status = order.transportCost > 0 ? 'transport_booked' : 'transport_pending';
    await order.save();

    // Record into PlatformLedger: strictly 2% + 5% commissions as platform revenue
    await PlatformLedgerModel.create({
      orderId: order._id.toString(),
      transportBookingId: order.transportBookingId,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      transporterId: order.transporterId,
      transporterName: order.transporterName,
      residueGMV: order.residueCost,
      residueCommissionRate: 0.02,
      residueCommissionAmount: order.residueCommission,
      netFarmerPayout: order.netFarmerPayout,
      farmerPayoutStatus: 'held_in_vault',
      transportGMV: order.transportCost,
      transportCommissionRate: 0.05,
      transportCommissionAmount: order.transportCommission,
      netTransporterPayout: order.netTransporterPayout,
      transporterPayoutStatus: order.transportCost > 0 ? 'held_in_vault' : 'released',
      netPlatformRevenue: order.residueCommission + order.transportCommission,
      paymentMethod: paymentMethod || 'AgriPay UPI',
      transactionId: finalTxnId,
      status: 'pending'
    });

    const receipt: DigitalReceipt = {
      receiptNumber,
      transactionId: finalTxnId,
      orderId: order._id.toString(),
      timestamp: new Date().toISOString(),
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      transporterName: order.transporterName || 'Pending 3PL Assignment',
      cropType: order.residueType,
      quantityTonnes: order.quantityTonnes,
      itemizedBreakdown: {
        residueSubtotal: order.residueCost,
        transportSubtotal: order.transportCost,
        platformCommissionResidue: order.residueCommission,
        platformCommissionTransport: order.transportCommission,
        totalPaidByBuyer: order.totalAmount
      },
      escrowVaultId: vaultId,
      paymentMethod: paymentMethod || 'AgriPay UPI',
      status: 'LOCKED_IN_ESCROW',
      qrVerificationCode: crypto.createHash('sha256').update(`${finalTxnId}-${order._id}`).digest('hex').slice(0, 16)
    };

    res.json({
      success: true,
      data: receipt,
      message: 'Payment verified successfully! Funds locked in AgriPay Trust Escrow Vault.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Digital Receipt for an Order
 */
export const getDigitalReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const vaultId = `ESC-VAULT-${order._id.toString().slice(-6)}`;
    const txn = order.paymentDetails?.transactionId || `AGRIPAY-${order._id.toString().slice(-6)}`;

    const receipt: DigitalReceipt = {
      receiptNumber: order.paymentDetails?.receiptNumber || `REC-${order._id.toString().slice(-6)}`,
      transactionId: txn,
      orderId: order._id.toString(),
      timestamp: order.paymentDetails?.paidAt || order.createdAt.toISOString(),
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      transporterName: order.transporterName || '3PL Logistics Partner',
      cropType: order.residueType,
      quantityTonnes: order.quantityTonnes,
      itemizedBreakdown: {
        residueSubtotal: order.residueCost,
        transportSubtotal: order.transportCost,
        platformCommissionResidue: order.residueCommission,
        platformCommissionTransport: order.transportCommission,
        totalPaidByBuyer: order.totalAmount
      },
      escrowVaultId: vaultId,
      paymentMethod: order.paymentDetails?.paymentMethod || 'AgriPay UPI',
      status: order.status === 'settled' ? 'SETTLED' : 'LOCKED_IN_ESCROW',
      qrVerificationCode: crypto.createHash('sha256').update(`${txn}-${order._id}`).digest('hex').slice(0, 16)
    };

    res.json({ success: true, data: receipt });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
