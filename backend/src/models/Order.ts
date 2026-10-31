import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'confirmed'
  | 'transport_pending'
  | 'transport_booked'
  | 'dispatched'
  | 'in_transit'
  | 'weighbridge_verified'
  | 'delivered'
  | 'settled'
  | 'disputed';

export interface IDispatchMilestone {
  title: string;
  status: 'pending' | 'completed';
  timestamp?: string;
  location?: string;
}

export interface IPaymentDetails {
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'escrow_locked' | 'captured' | 'failed' | 'refunded';
  paidAt?: string;
  receiptNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface IPayoutStatus {
  farmer: 'pending' | 'inspection_verified' | 'released' | 'refunded';
  transporter: 'pending' | 'pod_verified' | 'released' | 'refunded';
}

export interface IOrder extends Document {
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  residueType: string;
  agreedPricePerTonne: number;
  quantityTonnes: number;
  // Financial Breakdowns (Buyer pays Material + Transport)
  residueCost: number; // agreedPricePerTonne * quantityTonnes
  transportCost: number; // Approved 3PL quote (paid by Buyer)
  totalAmount: number; // residueCost + transportCost (total buyer payable)
  // Commissions (2% residue, 5% transport)
  residueCommission: number; // 2%
  transportCommission: number; // 5%
  netFarmerPayout: number; // 98%
  netTransporterPayout: number; // 95%
  status: OrderStatus;
  originLocation: string;
  deliveryAddress: string;
  // 3PL Integration
  transportBookingId?: string;
  transporterId?: string;
  transporterName?: string;
  truckNumber?: string;
  driverPhone?: string;
  driverName?: string;
  weighbridgeWeightTonnes?: number;
  milestones: IDispatchMilestone[];
  paymentDetails?: IPaymentDetails;
  payoutStatus?: IPayoutStatus;
  disputeStatus?: 'none' | 'opened' | 'resolved';
  proofOfDeliverySlip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IDispatchMilestone>(
  {
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    timestamp: { type: String },
    location: { type: String }
  },
  { _id: false }
);

const PaymentDetailsSchema = new Schema<IPaymentDetails>(
  {
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, default: 'AgriPay-UPI' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'escrow_locked', 'captured', 'failed', 'refunded'],
      default: 'escrow_locked'
    },
    paidAt: { type: String, default: () => new Date().toISOString() },
    receiptNumber: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
  },
  { _id: false }
);

const PayoutStatusSchema = new Schema<IPayoutStatus>(
  {
    farmer: {
      type: String,
      enum: ['pending', 'inspection_verified', 'released', 'refunded'],
      default: 'pending'
    },
    transporter: {
      type: String,
      enum: ['pending', 'pod_verified', 'released', 'refunded'],
      default: 'pending'
    }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    listingId: { type: String, required: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    residueType: { type: String, required: true },
    agreedPricePerTonne: { type: Number, required: true },
    quantityTonnes: { type: Number, required: true },
    residueCost: { type: Number, required: true },
    transportCost: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    residueCommission: { type: Number, default: 0 },
    transportCommission: { type: Number, default: 0 },
    netFarmerPayout: { type: Number, default: 0 },
    netTransporterPayout: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'confirmed',
        'transport_pending',
        'transport_booked',
        'dispatched',
        'in_transit',
        'weighbridge_verified',
        'delivered',
        'settled',
        'disputed'
      ],
      default: 'confirmed'
    },
    originLocation: { type: String, default: 'Farm Gate' },
    deliveryAddress: { type: String, required: true },
    transportBookingId: { type: String },
    transporterId: { type: String },
    transporterName: { type: String },
    truckNumber: { type: String },
    driverPhone: { type: String },
    driverName: { type: String },
    weighbridgeWeightTonnes: { type: Number },
    milestones: [MilestoneSchema],
    paymentDetails: { type: PaymentDetailsSchema },
    payoutStatus: { type: PayoutStatusSchema, default: () => ({ farmer: 'pending', transporter: 'pending' }) },
    disputeStatus: { type: String, enum: ['none', 'opened', 'resolved'], default: 'none' },
    proofOfDeliverySlip: { type: String }
  },
  {
    timestamps: true
  }
);

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
