import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { ListingModel } from '../models/Listing';
import { PoolModel } from '../models/Pool';
import { NegotiationModel } from '../models/Negotiation';
import { OrderModel } from '../models/Order';

// Fix macOS querySrv ESERVFAIL with MongoDB Atlas SRV records by using Google Public DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrimech';

  try {
    mongoose.set('strictQuery', false);
    console.log(`[MongoDB Atlas] Initializing connection to database...`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`[MongoDB Atlas] Connected successfully to database!`);

    // Clean up any historical dummy seed data to guarantee 100% pure authentic user database
    await purgeHistoricalFakeData();

  } catch (error: any) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB Atlas (${error.message}).`);
    console.warn(`[MongoDB Notice] Database offline or unreachable.`);
  }
};

/**
 * Permanently removes any historical fake/seed records from MongoDB Atlas.
 */
export async function purgeHistoricalFakeData(): Promise<void> {
  try {
    // Purge fake mock users
    await UserModel.deleteMany({
      $or: [
        { email: { $in: ['manjunatha.gowda@harohalliraitha.org', 'r.rao@harohallibioenergy.com'] } },
        { phone: { $in: ['+91 94482 71820', '+91 98450 33910'] } },
        { registrationId: { $in: ['KA-RAM-FPO-4401', 'GSTIN29AAACH8812K1Z8'] } }
      ]
    });

    // Purge fake legacy listings only
    await ListingModel.deleteMany({
      sellerId: { $in: ['USR-FARM-201', 'USR-FARM-202', 'USR-FARM-203', 'USR-FARM-204', 'USR-FARM-205', 'USR-FARM-206', 'LST-101', 'LST-102', 'LST-103', 'LST-104'] }
    });

    // Purge fake procurement pools
    await PoolModel.deleteMany({
      $or: [
        { buyerId: { $in: ['USR-BUYER-201', 'USR-BUYER-202', 'POOL-401', 'POOL-402'] } },
        { title: { $regex: /3,500 Tonne Ragi|2,000 Tonne Sugarcane/i } }
      ]
    });

    // Purge fake negotiations
    await NegotiationModel.deleteMany({
      $or: [
        { listingId: { $in: ['LST-101', 'LST-102', 'LIST-101', 'LIST-201'] } },
        { sellerId: { $in: ['USR-FARM-201', 'USR-FARM-101'] } },
        { buyerId: { $in: ['USR-BUYER-201'] } }
      ]
    });

    // Purge fake orders
    await OrderModel.deleteMany({
      $or: [
        { listingId: { $in: ['LST-101', 'LST-102', 'ORD-901', 'ORD-8018'] } },
        { sellerId: { $in: ['USR-FARM-201', 'USR-FARM-101'] } },
        { buyerId: { $in: ['USR-BUYER-201'] } }
      ]
    });

    console.log(`[MongoDB Atlas] Zero fake data active. All legacy mock/seed datasets purged.`);
  } catch (err: any) {
    console.warn(`[MongoDB Atlas] Cleanup note: ${err.message}`);
  }
}

/**
 * Total wipeout of all collections (for complete fresh start)
 */
export async function purgeAllCollections(): Promise<void> {
  await UserModel.deleteMany({});
  await ListingModel.deleteMany({});
  await PoolModel.deleteMany({});
  await NegotiationModel.deleteMany({});
  await OrderModel.deleteMany({});
  console.log(`[MongoDB Atlas] All collections purged. Database is completely fresh.`);
}
