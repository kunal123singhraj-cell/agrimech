import mongoose, { Document, Schema } from 'mongoose';

export interface IPoolParticipant {
  sellerId: string;
  sellerName: string;
  committedTonnes: number;
  agreedPricePerTonne: number;
  joinedAt: string;
}

export interface IPool extends Document {
  title: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerOrg?: string;
  residueType: string;
  cropType?: string;
  targetTonnes: number;
  totalTonnes?: number;
  currentTonnes: number;
  offeredPricePerTonne: number;
  district: string;
  state: string;
  deliveryLocation?: string;
  maxMoisturePercent: number;
  deadline: string;
  status: 'open' | 'fulfilled' | 'closed';
  coordinates?: {
    lat: number;
    lng: number;
  };
  participants: IPoolParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IPoolParticipant>({
  sellerId: { type: String, required: true },
  sellerName: { type: String, required: true },
  committedTonnes: { type: Number, required: true },
  agreedPricePerTonne: { type: Number, required: true },
  joinedAt: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const PoolSchema = new Schema<IPool>(
  {
    title: { type: String, required: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String },
    buyerOrg: { type: String },
    residueType: { type: String, default: 'Agricultural Residue' },
    cropType: { type: String },
    targetTonnes: { type: Number, required: true },
    totalTonnes: { type: Number },
    currentTonnes: { type: Number, default: 0 },
    offeredPricePerTonne: { type: Number, required: true },
    district: { type: String, default: 'Local Hub' },
    state: { type: String, default: 'Pan-India' },
    deliveryLocation: { type: String },
    coordinates: {
      lat: { type: Number, default: 12.6560 },
      lng: { type: Number, default: 77.4430 }
    },
    maxMoisturePercent: { type: Number, default: 12 },
    deadline: { type: String, default: () => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] },
    status: { type: String, enum: ['open', 'fulfilled', 'closed'], default: 'open' },
    participants: [ParticipantSchema]
  },
  {
    timestamps: true
  }
);

export const PoolModel = mongoose.model<IPool>('Pool', PoolSchema);
