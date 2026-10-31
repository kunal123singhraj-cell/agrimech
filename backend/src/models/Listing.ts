import mongoose, { Document, Schema } from 'mongoose';

export type ResidueType = 'ragi_straw' | 'mulberry_stalks' | 'coconut_shell' | 'sugarcane_bagasse' | 'paddy_straw' | 'maize_stover' | 'wheat_stubble' | 'mustard_husk' | string;
export type BalingStatus = 'loose' | 'square_bales' | 'round_bales' | 'pelletized' | string;
export type ListingStatus = 'active' | 'in_negotiation' | 'reserved' | 'dispatched' | 'sold';

export interface IListing extends Document {
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  residueType: ResidueType;
  variety: string;
  totalTonnes: number;
  availableTonnes: number;
  pricePerTonne: number;
  moisturePercent: number;
  balingStatus: BalingStatus;
  district: string;
  state: string;
  village?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  harvestDate: string;
  status: ListingStatus;
  notes?: string;
  verifiedWeighbridge: boolean;
  imageUrl?: string;
  calorificValue?: string;
  co2AbatedTonnes?: number;
  reservedBy?: {
    buyerId: string;
    buyerName: string;
    buyerPhone?: string;
  };
  reservedUntil?: Date;
  reservedTonnes?: number;
  ashPercent?: number;
  aqiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerPhone: { type: String },
    residueType: {
      type: String,
      required: true
    },
    variety: { type: String, required: true },
    totalTonnes: { type: Number, required: true },
    availableTonnes: { type: Number, required: true },
    pricePerTonne: { type: Number, required: true },
    moisturePercent: { type: Number, required: true },
    balingStatus: {
      type: String,
      default: 'square_bales'
    },
    district: { type: String, required: true },
    state: { type: String, required: true },
    village: { type: String },
    coordinates: {
      lat: { type: Number, default: 12.6560 },
      lng: { type: Number, default: 77.4430 }
    },
    harvestDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: {
      type: String,
      enum: ['active', 'in_negotiation', 'reserved', 'dispatched', 'sold'],
      default: 'active'
    },
    notes: { type: String },
    verifiedWeighbridge: { type: Boolean, default: true },
    imageUrl: { type: String },
    calorificValue: { type: String },
    co2AbatedTonnes: { type: Number },
    reservedBy: {
      buyerId: { type: String },
      buyerName: { type: String },
      buyerPhone: { type: String }
    },
    reservedUntil: { type: Date },
    reservedTonnes: { type: Number },
    ashPercent: { type: Number, default: 6 },
    aqiScore: { type: Number, default: 85 }
  },
  {
    timestamps: true
  }
);

export const ListingModel = mongoose.model<IListing>('Listing', ListingSchema);
