import { Injectable, signal } from '@angular/core';
import { Order, EscrowStatus, TrackingMilestone } from '../models/marketplace.model';

export interface EscrowSecurityCertificate {
  certificateId: string;
  escrowVaultId: string;
  orderId: string;
  issueDate: string;
  buyerName: string;
  sellerName: string;
  cropType: string;
  quantityTons: number;
  totalInvoiceAmount: number;
  advance50PercentHeld: number;
  balance50PercentDueOnDelivery: number;
  status: EscrowStatus;
  escrowStatusLabel: string;
  guaranteeTerms: string;
  qrVerificationCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class EscrowService {
  /**
   * Generates default 5-stage tracking milestones for an order
   */
  generateDefaultMilestones(
    date: string,
    origin: string,
    destination: string,
    truckDetails: string
  ): TrackingMilestone[] {
    return [
      {
        stage: 1,
        title: 'Deal Confirmed & Terms Locked',
        description: `Contract sealed between ${origin} and ${destination}. Commercial price and volume locked.`,
        timestamp: `${date}, 10:00`,
        completed: true,
        active: false,
        icon: 'file-text',
        detailNote: 'Digital agreement signed with cryptographic transaction hash.'
      },
      {
        stage: 2,
        title: '50% Advance Escrow Deposited & Held in Vault',
        description: 'Advance funds held in neutral AgriMech Trust Vault. Zero risk for both parties.',
        timestamp: `${date}, 11:30`,
        completed: true,
        active: false,
        icon: 'shield',
        detailNote: 'Protected by AgriMech 100% money-back quality guarantee.'
      },
      {
        stage: 3,
        title: 'Heavy Truck Dispatched from Farm Gate',
        description: `Vehicle ${truckDetails} loaded and departed along highway freight corridor.`,
        timestamp: `${date}, 14:15`,
        completed: true,
        active: true,
        icon: 'truck',
        detailNote: 'Real-time GPS transit tracking active with driver phone connection.'
      },
      {
        stage: 4,
        title: 'Weighbridge Gross & Moisture Laboratory Inspection',
        description: 'Electronic tare weight verified; moisture tested to ensure compliance (<12-14%).',
        timestamp: 'Estimated at Delivery Gate',
        completed: false,
        active: false,
        icon: 'scale',
        detailNote: 'Digital weighbridge slip generated prior to final clearance.'
      },
      {
        stage: 5,
        title: 'Consignment Accepted & 50% Balance Released',
        description: 'Factory gate in-charge signs off; remaining 50% balance immediately released to seller.',
        timestamp: 'Pending Delivery Signoff',
        completed: false,
        active: false,
        icon: 'check-circle',
        detailNote: 'Instant RTGS/UPI bank settlement with electronic tax invoice.'
      }
    ];
  }

  /**
   * Generates the official Digitally Verified 50% Escrow Security Receipt
   */
  getSecurityCertificate(order: Order): EscrowSecurityCertificate {
    const advance = order.advancePaymentAmount || Math.round(order.totalAmount * 0.5);
    const balance = order.balancePaymentAmount || (order.totalAmount - advance);

    let statusLabel = '50% Advance Secured in AgriMech Escrow Vault';
    if (order.escrowStatus === 'inspection_passed') {
      statusLabel = 'Weighbridge & Moisture Verified • Ready for Release';
    } else if (order.escrowStatus === 'released_to_seller') {
      statusLabel = '100% Settled • Funds Disbursed to Seller';
    } else if (order.escrowStatus === 'refunded') {
      statusLabel = 'Refunded to Buyer • Inspection Discrepancy';
    }

    return {
      certificateId: `AGRI-ESC-CERT-${order.id.replace('ORD-', '')}`,
      escrowVaultId: order.escrowVaultId || `ESC-VAULT-${order.id.slice(-4)}`,
      orderId: order.id,
      issueDate: order.escrowDepositDate || order.date,
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      cropType: order.cropType,
      quantityTons: order.quantityTons,
      totalInvoiceAmount: order.totalAmount,
      advance50PercentHeld: advance,
      balance50PercentDueOnDelivery: balance,
      status: order.escrowStatus,
      escrowStatusLabel: statusLabel,
      guaranteeTerms: order.refundGuaranteeTerms ||
        'AgriMech acts as neutral escrow trustee. The 50% advance deposit is securely held in the AgriMech Escrow Vault. Funds will NOT be disbursed to the seller until electronic weighbridge tare and moisture lab inspection confirm contractual compliance. If quality test fails or shipment is not delivered, 100% of the escrow deposit will be promptly refunded to the buyer account.',
      qrVerificationCode: `https://agrimech.in/verify-escrow?vault=${order.escrowVaultId}&order=${order.id}`
    };
  }
}
