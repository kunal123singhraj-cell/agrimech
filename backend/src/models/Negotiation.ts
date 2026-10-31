import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceOffer {
  id: string;
  senderRole: 'farmer' | 'buyer';
  pricePerTonne: number;
  quantityTonnes: number;
  deliveryTerms: 'ex_farm' | 'delivered_at_plant';
  freightBearer: 'buyer' | 'seller';
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  timestamp: string;
}

export interface IChatMessage {
  id: string;
  senderId: string;
  senderRole: 'farmer' | 'buyer';
  senderName: string;
  content: string;
  timestamp: string;
  offer?: IPriceOffer;
  detectedLanguage?: string;
  originalLanguage?: string;
  translations?: Record<string, string>;
}

export interface INegotiation extends Document {
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: 'active' | 'agreed' | 'rejected' | 'converted_to_order';
  messages: IChatMessage[];
  currentOffer?: IPriceOffer;
  createdAt: Date;
  updatedAt: Date;
}

const PriceOfferSchema = new Schema<IPriceOffer>({
  id: { type: String, required: true },
  senderRole: { type: String, enum: ['farmer', 'buyer'], required: true },
  pricePerTonne: { type: Number, required: true },
  quantityTonnes: { type: Number, required: true },
  deliveryTerms: { type: String, enum: ['ex_farm', 'delivered_at_plant'], default: 'ex_farm' },
  freightBearer: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  validUntil: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'countered'], default: 'pending' },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const ChatMessageSchema = new Schema<IChatMessage>({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['farmer', 'buyer'], required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  offer: { type: PriceOfferSchema },
  detectedLanguage: { type: String, default: 'en' },
  originalLanguage: { type: String, default: 'en' },
  translations: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const NegotiationSchema = new Schema<INegotiation>(
  {
    listingId: { type: String, required: true },
    listingTitle: { type: String, required: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'agreed', 'rejected', 'converted_to_order'],
      default: 'active'
    },
    messages: [ChatMessageSchema],
    currentOffer: { type: PriceOfferSchema }
  },
  {
    timestamps: true
  }
);

export const NegotiationModel = mongoose.model<INegotiation>('Negotiation', NegotiationSchema);
