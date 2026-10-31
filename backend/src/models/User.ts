import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'farmer' | 'buyer' | 'transporter' | 'admin';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  organization: string;
  registrationId: string;
  district: string;
  state: string;
  password?: string;
  // 3PL Transporter specific fields
  companyName?: string;
  gstin?: string;
  transportLicense?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  fleetSize?: number;
  operatingStates?: string[];
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  // Multilingual preferences
  preferredLanguage?: string;
  chatLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ['farmer', 'buyer', 'transporter', 'admin'], required: true },
    organization: { type: String, required: true },
    registrationId: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    password: { type: String },
    companyName: { type: String },
    gstin: { type: String },
    transportLicense: { type: String },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    fleetSize: { type: Number, default: 1 },
    operatingStates: [{ type: String }],
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      bankName: { type: String }
    },
    preferredLanguage: { type: String, default: 'en' },
    chatLanguage: { type: String, default: 'en' }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
