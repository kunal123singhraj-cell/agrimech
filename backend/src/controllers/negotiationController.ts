import { Response } from 'express';
import { NegotiationModel } from '../models/Negotiation';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getNegotiationThreads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role || 'farmer';
    const userId = req.user?.id;

    if (!userId) {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    let threads: any[] = [];
    try {
      const query = role === 'farmer' ? { sellerId: userId } : { buyerId: userId };
      threads = await NegotiationModel.find(query).sort({ updatedAt: -1 });
    } catch {
      threads = [];
    }

    res.json({ success: true, count: threads.length, data: threads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNegotiationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let thread = null;

    try {
      thread = await NegotiationModel.findById(id);
    } catch {
      thread = null;
    }

    if (!thread) {
      res.status(404).json({ success: false, message: 'Negotiation thread not found' });
      return;
    }

    res.json({ success: true, data: thread });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendNegotiationMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, offer } = req.body;
    const senderRole = req.user?.role || 'farmer';
    const senderName = req.user?.name || (senderRole === 'farmer' ? 'Residue Seller' : 'Procurement Buyer');
    const senderId = req.user?.id || (senderRole === 'farmer' ? 'USR-FARM' : 'USR-BUYER');

    const newMessage = {
      id: 'MSG-' + Date.now().toString().slice(-4),
      senderId,
      senderRole,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      offer
    };

    try {
      const updateData: any = {
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() }
      };
      if (offer) {
        updateData.$set.currentOffer = offer;
      }
      await NegotiationModel.findByIdAndUpdate(id, updateData);
    } catch {
      // ignore offline fallback
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
