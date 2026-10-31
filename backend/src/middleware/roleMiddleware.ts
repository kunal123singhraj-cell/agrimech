import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export const requireRole = (allowedRole: 'farmer' | 'buyer') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (req.user.role !== allowedRole) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This resource is only accessible by ${allowedRole === 'farmer' ? 'Farmers / Sellers' : 'Industrial Buyers'}.`
      });
      return;
    }

    next();
  };
};
