export type UserRole = 'farmer' | 'buyer' | 'transporter' | 'admin';

export type I18nLanguage = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml' | 'mr' | 'bn';

export type CropKey = 'ragi' | 'mulberry' | 'coconut' | 'sugarcane' | 'paddy' | 'maize' | 'wheat' | 'cotton' | 'mustard';

export type MoistureLevel = 'low' | 'medium' | 'high';

export type BalingKey = 'square' | 'round' | 'loose' | 'pellets';

export type OrderStatus =
  | 'Confirmed'
  | 'Order Placed'
  | 'Transport Pending'
  | 'Transport Booked'
  | 'Dispatched'
  | 'In Transit'
  | 'Weighbridge Verified'
  | 'Delivered'
  | 'Settled'
  | 'Disputed';

export interface HubLocation {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  state: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  organization: string;
  registrationId: string;
  district: string;
  state: string;
  // 3PL Transporter specific fields
  companyName?: string;
  gstin?: string;
  transportLicense?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  fleetSize?: number;
  operatingStates?: string[];
  // Multilingual preferences
  preferredLanguage?: I18nLanguage;
  chatLanguage?: I18nLanguage;
}

export interface Listing {
  id: string;
  cropType: string;
  cropKey: CropKey;
  region: string;
  district: string;
  farmerName: string;
  farmerPhone: string;
  verified: boolean;
  rating: number;
  dealsCompleted: number;
  harvestDate: string;
  moisturePercent: number;
  moistureLevel: MoistureLevel;
  balingType: string;
  balingKey: BalingKey;
  qualityGrade: string;
  quantityTons: number;
  pricePerTon: number;
  distanceKm: number;
  storageType: string;
  calorificValue: string;
  co2AvoidedTons: number;
  description: string;
  tags: string[];
  lat: number;
  lng: number;
  imageUrl?: string;
  ownerPhone?: string;
  ownerId?: string;
  // USP 3: Quality-Based Supplier Ranking
  aqiScore?: number;
  aqiGrade?: string;
  ashPercent?: number;
  // USP 4: Smart Stock Reservation
  status?: 'active' | 'reserved' | 'sold';
  reservedUntil?: string;
  reservedTons?: number;
  reservedBy?: {
    buyerId: string;
    buyerName: string;
    buyerPhone?: string;
  };
}

export interface BulkRequirement {
  id: string;
  title: string;
  buyerOrg: string;
  cropType: string;
  requiredTons: number;
  pooledTons: number;
  targetPricePerTon: number;
  region: string;
  deadline: string;
  status: 'Open' | 'Nearly Full' | 'Fulfilled';
  contributorsCount: number;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  buyerPhone?: string;
  buyerId?: string;
}

export interface PriceOffer {
  id: string;
  sender: 'buyer' | 'farmer' | 'seller';
  offeredPricePerTon: number;
  quantityTons: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'declined';
  timestamp: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  senderName: string;
  text: string;
  timestamp: string;
  offer?: PriceOffer;
  // Multilingual Negotiation Centre
  detectedLanguage?: string;
  originalLanguage?: string;
  translations?: Record<string, string>;
  showOriginal?: boolean;
}

export interface NegotiationThread {
  id: string;
  listingId: string;
  counterpartyName: string;
  counterpartyRole: 'Seller' | 'Buyer';
  cropType: string;
  quantityTons: number;
  askingPricePerTon: number;
  status: 'active' | 'accepted' | 'rejected';
  lastMessage: string;
  lastUpdated: string;
  unreadCount: number;
  messages: ChatMessage[];
  currentOffer?: PriceOffer;
  buyerLocation?: string;
  distanceKm?: number;
  transitTime?: string;
  estimatedFreightPerTon?: number;
}

export type EscrowStatus =
  | 'pending_deposit'
  | 'held_in_vault'
  | 'inspection_passed'
  | 'released_to_seller'
  | 'refunded';

export interface TrackingMilestone {
  stage: number;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  active: boolean;
  icon: string;
  detailNote?: string;
}

export interface IPaymentDetails {
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'escrow_locked' | 'captured' | 'failed' | 'refunded';
  paidAt?: string;
  receiptNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface IPayoutStatus {
  farmer: 'pending' | 'inspection_verified' | 'released' | 'refunded';
  transporter: 'pending' | 'pod_verified' | 'released' | 'refunded';
}

export interface Order {
  id: string;
  date: string;
  buyerName: string;
  sellerName: string;
  cropType: string;
  quantityTons: number;
  pricePerTon: number;
  // Financial Breakdowns (Buyer Pays Residue + Transport)
  residueCost?: number;
  transportCost?: number;
  totalAmount: number;
  residueCommission?: number; // 2%
  transportCommission?: number; // 5%
  netFarmerPayout?: number; // 98%
  netTransporterPayout?: number; // 95%
  status: OrderStatus;
  originLocation: string;
  deliveryLocation: string;
  truckDetails: string;
  distanceKm?: number;
  transitTime?: string;
  estimatedDelivery?: string;
  expectedDelivery?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  truckNumber?: string;
  driverPhone?: string;
  createdDate?: string;
  listingId?: string;
  sellerPhone?: string;
  buyerPhone?: string;
  // 3PL Integration
  transportBookingId?: string;
  transporterId?: string;
  transporterName?: string;
  driverName?: string;
  proofOfDeliverySlip?: string;
  // Escrow & Payment Details
  escrowStatus: EscrowStatus;
  advancePaymentAmount: number;
  balancePaymentAmount: number;
  escrowVaultId: string;
  escrowDepositDate: string;
  trackingMilestones: TrackingMilestone[];
  weighbridgeSlipNumber?: string;
  moistureCertified?: number;
  refundGuaranteeTerms: string;
  paymentDetails?: IPaymentDetails;
  payoutStatus?: IPayoutStatus;
}

// ----------------------------------------------------
// 3PL FLEET & TRANSPORTATION INTERFACES
// ----------------------------------------------------

export type VehicleType = 'pickup_3t' | 'eicher_8t' | 'taurus_16t' | 'trailer_28t';

export interface Vehicle {
  id?: string;
  _id?: string;
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
  createdAt?: string;
}

export interface TransportQuotation {
  id: string;
  transporterId: string;
  transporterName: string;
  transporterPhone: string;
  transporterRating: number;
  vehicleType: string;
  vehicleCapacityTonnes: number;
  vehicleRegistrationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  quoteAmount: number;
  breakdown: {
    baseFreight: number;
    fuelSurcharge: number;
    tolls: number;
    loadingUnloadingHandling: number;
  };
  estimatedDays: number;
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  notes?: string;
}

export interface TrackingCoord {
  lat: number;
  lng: number;
  locationName: string;
  timestamp: string;
  statusNote: string;
}

export interface ProofOfDelivery {
  slipNumber: string;
  weighbridgeGrossTonnes: number;
  weighbridgeTareTonnes: number;
  netWeightTonnes: number;
  documentUrl?: string;
  verifiedByBuyer: boolean;
  verifiedAt?: string;
  receiverNotes?: string;
}

export interface TransportBooking {
  id?: string;
  _id?: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  residueType: string;
  quantityTonnes: number;
  pickupLocation: {
    address: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
  };
  deliveryLocation: {
    address: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
  };
  distanceKm: number;
  status:
    | 'requested'
    | 'quoted'
    | 'booked'
    | 'dispatched'
    | 'in_transit'
    | 'delivered'
    | 'pod_verified'
    | 'cancelled';
  quotations: TransportQuotation[];
  selectedQuotationId?: string;
  agreedTransportCost?: number;
  assignedTransporterId?: string;
  assignedTransporterName?: string;
  assignedVehicleNumber?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  targetPickupDate: string;
  actualPickupDate?: string;
  targetDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingHistory: TrackingCoord[];
  proofOfDelivery?: ProofOfDelivery;
  createdAt?: string;
}

// ----------------------------------------------------
// AGRIPAY & PLATFORM REVENUE INTERFACES
// ----------------------------------------------------

export interface AgriPayReceipt {
  receiptNumber: string;
  transactionId: string;
  orderId: string;
  timestamp: string;
  buyerName: string;
  sellerName: string;
  transporterName: string;
  cropType: string;
  quantityTonnes: number;
  itemizedBreakdown: {
    residueSubtotal: number;
    transportSubtotal: number;
    platformCommissionResidue: number; // 2%
    platformCommissionTransport: number; // 5%
    totalPaidByBuyer: number;
  };
  escrowVaultId: string;
  paymentMethod: string;
  status: string;
  qrVerificationCode: string;
}

export interface PlatformRevenueMetrics {
  commissionConfig: {
    residueCommissionPercent: number;
    transportCommissionPercent: number;
  };
  totalResidueGMV: number;
  totalTransportGMV: number;
  totalGrossGMV: number;
  netAgriMechRevenue: number; // Only actual 2% + 5% commissions
  commissions: {
    residueCommissionEarned: number;
    residueCommissionRate: string;
    transportCommissionEarned: number;
    transportCommissionRate: string;
  };
  disbursements: {
    supplierDisbursed: number;
    supplierPendingInEscrow: number;
    transporter3PLDisbursed: number;
    transporter3PLPendingInEscrow: number;
  };
  orderCounts: {
    totalOrders: number;
    settledOrders: number;
    activeShipments: number;
    total3PLBookings: number;
  };
}

export interface AuditLedgerEntry {
  _id?: string;
  orderId: string;
  transportBookingId?: string;
  buyerName: string;
  sellerName: string;
  transporterName?: string;
  residueGMV: number;
  residueCommissionAmount: number;
  netFarmerPayout: number;
  farmerPayoutStatus: string;
  transportGMV: number;
  transportCommissionAmount: number;
  netTransporterPayout: number;
  transporterPayoutStatus: string;
  netPlatformRevenue: number;
  transactionId: string;
  status: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'offer' | 'order' | 'alert' | 'system' | 'pool' | 'transport' | 'payment';
  link?: string;
}
