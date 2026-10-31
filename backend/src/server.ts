import dns from 'dns';

// Fix macOS querySrv ESERVFAIL with MongoDB Atlas SRV records by using Google Public DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import negotiationRoutes from './routes/negotiationRoutes';
import orderRoutes from './routes/orderRoutes';
import poolRoutes from './routes/poolRoutes';
import transportRoutes from './routes/transportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import translationRoutes from './routes/translationRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for Angular frontend & all dev clients
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// API Health Check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AgriMech Backend API',
    database: 'MongoDB Atlas Connected',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/translate', translationRoutes);

// Serve static frontend in production if built
const candidateDistPaths = [
  path.join(__dirname, '../../frontend/dist/agrimech-frontend/browser'),
  path.join(__dirname, '../frontend/dist/agrimech-frontend/browser'),
  path.join(process.cwd(), 'frontend/dist/agrimech-frontend/browser'),
  path.join(process.cwd(), 'dist/agrimech-frontend/browser')
];

let frontendDistPath = '';
for (const p of candidateDistPaths) {
  if (fs.existsSync(p)) {
    frontendDistPath = p;
    break;
  }
}

if (frontendDistPath) {
  console.log(`[AgriMech Server] Serving static frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ success: false, message: 'API route not found' });
      return;
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Connect to MongoDB and start HTTP server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`[AgriMech Server] REST API running at http://localhost:${port}`);
    console.log(`[AgriMech Server] Health check endpoint: http://localhost:${port}/health`);
  });
});

export default app;
