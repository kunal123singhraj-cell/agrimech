import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { UserModel } from '../models/User';
import { ListingModel } from '../models/Listing';
import { PoolModel } from '../models/Pool';
import { NegotiationModel } from '../models/Negotiation';
import { OrderModel } from '../models/Order';
import { OtpModel } from '../models/Otp';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

dotenv.config();

async function runPurge() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrimech';
  console.log('[Purge Engine] Connecting to MongoDB...');
  
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('[Purge Engine] Connected successfully.');

    const userRes = await UserModel.deleteMany({});
    const listingRes = await ListingModel.deleteMany({});
    const poolRes = await PoolModel.deleteMany({});
    const negRes = await NegotiationModel.deleteMany({});
    const orderRes = await OrderModel.deleteMany({});
    const otpRes = await OtpModel.deleteMany({});

    console.log(`[Purge Engine] Results:`);
    console.log(`  - Users deleted: ${userRes.deletedCount}`);
    console.log(`  - Listings deleted: ${listingRes.deletedCount}`);
    console.log(`  - Pools deleted: ${poolRes.deletedCount}`);
    console.log(`  - Negotiations deleted: ${negRes.deletedCount}`);
    console.log(`  - Orders deleted: ${orderRes.deletedCount}`);
    console.log(`  - Otps deleted: ${otpRes.deletedCount}`);
    console.log(`[Purge Engine] 100% of all mock & fake data successfully eliminated from MongoDB!`);
  } catch (err: any) {
    console.error('[Purge Engine] Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runPurge();
