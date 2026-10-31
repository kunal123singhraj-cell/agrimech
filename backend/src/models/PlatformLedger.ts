import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformLedger extends Document {
  orderId: string;
  transportBookingId?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  transporterId?: string;
  transporterName?: string;
  // Residue Commission (2%)
  residueGMV: number;
  residueCommissionRate: number; // default 0.02
  residueCommissionAmount: number; // 2% of residueGMV
  netFarmerPayout: number; // 98% of residueGMV
  farmerPayoutStatus: 'held_in_vault' | 'inspection_verified' | 'released' | 'refunded';
  // Transportation Commission (5%)
  transportGMV: number;
  transportCommissionRate: number; // default 0.05
  transportCommissionAmount: number; // 5% of transportGMV
  netTransporterPayout: number; // 95% of transportGMV
  transporterPayoutStatus: 'held_in_vault' | 'pod_verified' | 'released' | 'refunded';
  // Net AgriMech Platform Revenue (ONLY 2% + 5% commissions!)
  netPlatformRevenue: number; // residueCommissionAmount + transportCommissionAmount
  // Payment Gateway Reference
  paymentMethod: string;
  transactionId: string;
  status: 'settled' | 'pending' | 'disputed' | 'refunded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformLedgerSchema = new Schema<IPlatformLedger>(
  {
    orderId: { type: String, required: true, index: true },
    transportBookingId: { type: String },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    transporterId: { type: String },
    transporterName: { type: String },
    residueGMV: { type: Number, required: true },
    residueCommissionRate: { type: Number, default: 0.02 },
    residueCommissionAmount: { type: Number, required: true },
    netFarmerPayout: { type: Number, required: true },
    farmerPayoutStatus: {
      type: String,
      enum: ['held_in_vault', 'inspection_verified', 'released', 'refunded'],
      default: 'held_in_vault'
    },
    transportGMV: { type: Number, default: 0 },
    transportCommissionRate: { type: Number, default: 0.05 },
    transportCommissionAmount: { type: Number, default: 0 },
    netTransporterPayout: { type: Number, default: 0 },
    transporterPayoutStatus: {
      type: String,
      enum: ['held_in_vault', 'pod_verified', 'released', 'refunded'],
      default: 'held_in_vault'
    },
    netPlatformRevenue: { type: Number, required: true },
    paymentMethod: { type: String, default: 'AgriPay-UPI' },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: ['settled', 'pending', 'disputed', 'refunded'],
      default: 'pending'
    },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

export const PlatformLedgerModel = mongoose.model<IPlatformLedger>('PlatformLedger', PlatformLedgerSchema);
