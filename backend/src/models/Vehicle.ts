import mongoose, { Document, Schema } from 'mongoose';

export type VehicleType = 'pickup_3t' | 'eicher_8t' | 'taurus_16t' | 'trailer_28t';

export interface IVehicle extends Document {
  transporterId: string;
  transporterName: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  vehicleTypeName: string;
  capacityTonnes: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  status: 'available' | 'on_trip' | 'maintenance';
  baseLocation: string;
  operatingStates: string[];
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    transporterId: { type: String, required: true, index: true },
    transporterName: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicleType: {
      type: String,
      enum: ['pickup_3t', 'eicher_8t', 'taurus_16t', 'trailer_28t'],
      required: true
    },
    vehicleTypeName: { type: String, required: true },
    capacityTonnes: { type: Number, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    driverLicense: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'on_trip', 'maintenance'],
      default: 'available'
    },
    baseLocation: { type: String, required: true },
    operatingStates: [{ type: String }],
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

export const VehicleModel = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
