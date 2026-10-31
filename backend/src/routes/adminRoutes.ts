import { Router } from 'express';
import {
  getRevenueMetrics,
  getAuditLedger,
  get3PLPartners,
  review3PLPartner,
  updateCommissionRates
} from '../controllers/adminController';

const router = Router();

router.get('/revenue-metrics', getRevenueMetrics);
router.get('/audit-ledger', getAuditLedger);
router.get('/3pl-partners', get3PLPartners);
router.post('/review-3pl', review3PLPartner);
router.post('/commission-rates', updateCommissionRates);

export default router;
