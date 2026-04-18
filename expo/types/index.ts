export type UserRole = 'sender' | 'traveler' | 'receiver' | 'admin';
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';
export type ShipmentStatus = 'created' | 'quoted' | 'pending_acceptance' | 'assigned' | 'payment_pending' | 'confirmed' | 'pickup_delayed' | 'no_show' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivery_attempted' | 'delivered' | 'returning' | 'returned' | 'completed' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'declined';
export type CancellationReason = 'user_cancelled' | 'traveler_declined' | 'traveler_timeout' | 'admin_cancelled' | 'no_show' | 'other';
export type DisputeType = 'not_delivered' | 'wrong_item' | 'damaged' | 'payment_issue' | 'other';
export type PaymentStatus = 'initiated' | 'held' | 'released' | 'failed' | 'cod_pending';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater' | 'emi' | 'cod';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type VehicleType = 'car' | 'bike' | 'train' | 'flight' | 'bus';
export type TravelMode = 'car' | 'train' | 'bus' | 'lorry' | 'bike' | 'flight' | 'others';
export type ChatType = 'sender_traveler' | 'user_admin';
export type NotificationType = 'quote' | 'shipment' | 'payment' | 'kyc' | 'system' | 'chat' | 'tracking';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  kycStatus: KYCStatus;
  rating: number;
  totalDeliveries: number;
  totalShipments: number;
  avatarUrl?: string;
  createdAt: string;
  gender?: Gender;
  address?: UserAddress;
  vehicleDetails?: VehicleDetails;
  isOnline?: boolean;
  lastSeen?: string;
  earnings?: number;
  aadhaarVerified?: boolean;
  aadhaarNumber?: string;
  panVerified?: boolean;
  bankVerified?: boolean;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
}

export interface UserAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface VehicleDetails {
  type: VehicleType;
  vehicleNumber?: string;
  model?: string;
  color?: string;
  documents?: string[];
}

export interface Shipment {
  id: string;
  parcelRequestId: string;
  senderId: string;
  senderName: string;
  senderPhone?: string;
  receiverId?: string;
  receiverName?: string;
  receiverPhone?: string;
  pickupCity: string;
  destinationCity: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupCoords?: GeoCoordinates;
  destinationCoords?: GeoCoordinates;
  parcelDetails: ParcelDetails;
  status: ShipmentStatus;
  assignedTravelerId?: string;
  assignedTravelerName?: string;
  assignedTravelerPhone?: string;
  preferredDate: string;
  createdAt: string;
  updatedAt: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  pickupOtpVerified?: boolean;
  deliveryOtpVerified?: boolean;
  quotesCount: number;
  acceptedQuoteAmount?: number;
  pickupImages?: string[];
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentCompleted?: boolean;
  specialInstructions?: string;
  currentLocation?: GeoCoordinates;
  trackingHistory?: TrackingPoint[];
  chatId?: string;
  // Traveler pickup details (filled by traveler before assignment)
  travelerTravelMode?: TravelMode;
  travelerDeliveryDate?: string;
  travelerParcelImage?: string;
  pickupDetailsCompleted?: boolean;
  // Delivery verification
  deliveryImages?: string[];
  deliveryConfirmedAt?: string;
  receiverSignature?: string;
  // Job acceptance (traveler must accept within deadline after quote accepted)
  jobAcceptDeadline?: string;
  jobAcceptedAt?: string;
  // Cancellation
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: CancellationReason;
  cancellationNote?: string;
  // Time windows
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  // No-show & reassignment
  noShowAt?: string;
  noShowMarkedBy?: string;
  reassignmentRequested?: boolean;
  // Delivery attempted / return flow
  deliveryAttemptedAt?: string;
  deliveryAttemptReason?: string;
  rescheduledDeliveryDate?: string;
  returnReason?: string;
  returnedAt?: string;
  // Rating
  senderRating?: number;
  travelerRating?: number;
  // Dispute
  disputeId?: string;
}

export interface Dispute {
  id: string;
  shipmentId: string;
  raisedBy: string;
  type: DisputeType;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface UserRiskFlags {
  userId: string;
  cancellations7d: number;
  disputes30d: number;
  highValueRequests24h: number;
  lastUpdated: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface TrackingPoint {
  id: string;
  coords: GeoCoordinates;
  timestamp: string;
  status: ShipmentStatus;
  message?: string;
}

export interface ParcelDetails {
  description: string;
  weight: number;
  dimensions: string;
  category: string;
  estimatedValue: number;
  fragile: boolean;
  images?: string[];
}

export interface TravelRoute {
  id: string;
  travelerId: string;
  travelerName: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  description?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  shipmentId: string;
  travelerId: string;
  travelerName: string;
  travelerRating: number;
  travelerDeliveries: number;
  amount: number;
  estimatedDelivery: string;
  message?: string;
  status: QuoteStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  shipmentId: string;
  senderId: string;
  travelerId: string;
  amount: number;
  platformFee: number;
  travelerAmount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  escrowHeld: boolean;
  createdAt: string;
  completedAt?: string;
  releasedAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface Review {
  id: string;
  shipmentId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license';
  documentUrl: string;
  selfieUrl?: string;
  status: KYCStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface KYCRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: UserRole;
  avatar?: string;
  aadhaarNumber: string;
  panNumber: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  selfieUploaded: boolean;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  bankVerified?: boolean;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface SupportCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SupportMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: string[];
  isEscalated?: boolean;
  adminId?: string;
}

export interface ChatConversation {
  id: string;
  type: ChatType;
  participants: string[];
  shipmentId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  read: boolean;
  imageUrl?: string;
  isSystemMessage?: boolean;
}

export interface EscalatedTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  category: string;
  subcategory?: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAdminId?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSenders: number;
  totalTravelers: number;
  activeShipments: number;
  completedShipments: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  totalRevenue: number;
  monthlyRevenue: number;
  platformCommission: number;
  openTickets: number;
  resolvedTickets: number;
}
