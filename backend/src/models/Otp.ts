import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, trim: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Automatic MongoDB TTL deletion
    verified: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const OtpModel = mongoose.model<IOtp>('Otp', OtpSchema);
