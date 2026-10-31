import mongoose, { Document, Schema } from 'mongoose';

export type TransportStatus =
  | 'requested'
  | 'quoted'
  | 'booked'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'pod_verified'
  | 'cancelled';

export interface ITransportQuotation {
  id: string;
  transporterId: string;
  transporterName: string;
  transporterPhone: string;
  transporterRating: number;
  vehicleType: string;
  vehicleCapacityTonnes: number;
  vehicleRegistrationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  quoteAmount: number;
  breakdown: {
    baseFreight: number;
    fuelSurcharge: number;
    tolls: number;
    loadingUnloadingHandling: number;
  };
  estimatedDays: number;
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  notes?: string;
}

export interface ITrackingCoord {
  lat: number;
  lng: number;
  locationName: string;
  timestamp: string;
  statusNote: string;
}

export interface IProofOfDelivery {
  slipNumber: string;
  weighbridgeGrossTonnes: number;
  weighbridgeTareTonnes: number;
  netWeightTonnes: number;
  documentUrl?: string;
  verifiedByBuyer: boolean;
  verifiedAt?: string;
  receiverNotes?: string;
}

export interface ITransportBooking extends Document {
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  residueType: string;
  quantityTonnes: number;
  pickupLocation: {
    address: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
  };
  deliveryLocation: {
    address: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
  };
  distanceKm: number;
  status: TransportStatus;
  quotations: ITransportQuotation[];
  selectedQuotationId?: string;
  agreedTransportCost?: number;
  assignedTransporterId?: string;
  assignedTransporterName?: string;
  assignedVehicleNumber?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  targetPickupDate: string;
  actualPickupDate?: string;
  targetDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingHistory: ITrackingCoord[];
  proofOfDelivery?: IProofOfDelivery;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<ITransportQuotation>(
  {
    id: { type: String, required: true },
    transporterId: { type: String, required: true },
    transporterName: { type: String, required: true },
    transporterPhone: { type: String, required: true },
    transporterRating: { type: Number, default: 4.8 },
    vehicleType: { type: String, required: true },
    vehicleCapacityTonnes: { type: Number, required: true },
    vehicleRegistrationNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    quoteAmount: { type: Number, required: true },
    breakdown: {
      baseFreight: { type: Number, required: true },
      fuelSurcharge: { type: Number, required: true },
      tolls: { type: Number, required: true },
      loadingUnloadingHandling: { type: Number, required: true }
    },
    estimatedDays: { type: Number, required: true },
    validUntil: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    notes: { type: String }
  },
  { _id: false }
);

const TrackingCoordSchema = new Schema<ITrackingCoord>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    locationName: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    statusNote: { type: String, required: true }
  },
  { _id: false }
);

const ProofOfDeliverySchema = new Schema<IProofOfDelivery>(
  {
    slipNumber: { type: String, required: true },
    weighbridgeGrossTonnes: { type: Number, required: true },
    weighbridgeTareTonnes: { type: Number, required: true },
    netWeightTonnes: { type: Number, required: true },
    documentUrl: { type: String },
    verifiedByBuyer: { type: Boolean, default: false },
    verifiedAt: { type: String },
    receiverNotes: { type: String }
  },
  { _id: false }
);

const TransportBookingSchema = new Schema<ITransportBooking>(
  {
    orderId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerPhone: { type: String, required: true },
    residueType: { type: String, required: true },
    quantityTonnes: { type: Number, required: true },
    pickupLocation: {
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    deliveryLocation: {
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    distanceKm: { type: Number, required: true },
    status: {
      type: String,
      enum: ['requested', 'quoted', 'booked', 'dispatched', 'in_transit', 'delivered', 'pod_verified', 'cancelled'],
      default: 'requested'
    },
    quotations: [QuotationSchema],
    selectedQuotationId: { type: String },
    agreedTransportCost: { type: Number },
    assignedTransporterId: { type: String },
    assignedTransporterName: { type: String },
    assignedVehicleNumber: { type: String },
    assignedDriverName: { type: String },
    assignedDriverPhone: { type: String },
    targetPickupDate: { type: String, required: true },
    actualPickupDate: { type: String },
    targetDeliveryDate: { type: String, required: true },
    actualDeliveryDate: { type: String },
    trackingHistory: [TrackingCoordSchema],
    proofOfDelivery: { type: ProofOfDeliverySchema }
  },
  {
    timestamps: true
  }
);

export const TransportBookingModel = mongoose.model<ITransportBooking>('TransportBooking', TransportBookingSchema);
