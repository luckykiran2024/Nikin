import { db as inMemoryDb } from './store';
import { SupabaseAdapter } from './supabase-adapter';
import {
  User,
  Shipment,
  Quote,
  TravelRoute,
  ChatConversation,
  ChatMessage,
  Notification,
  EscalatedTicket,
  Payment,
  KYCRequest,
} from '@/types';

export interface DatabaseInterface {
  // Users
  createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> | User;
  getUserById(id: string): Promise<User | undefined> | User | undefined;
  getUserByPhone(phone: string): Promise<User | undefined> | User | undefined;
  getUserByEmail(email: string): Promise<User | undefined> | User | undefined;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined> | User | undefined;
  getAllUsers(): Promise<User[]> | User[];

  // Shipments
  createShipment(shipmentData: Omit<Shipment, 'id' | 'parcelRequestId' | 'createdAt' | 'updatedAt' | 'quotesCount' | 'pickupOtp' | 'deliveryOtp'>): Promise<Shipment> | Shipment;
  getShipmentById(id: string): Promise<Shipment | undefined> | Shipment | undefined;
  updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment | undefined> | Shipment | undefined;
  getAllShipments(): Promise<Shipment[]> | Shipment[];
  getShipmentsBySenderId(senderId: string): Promise<Shipment[]> | Shipment[];
  getShipmentsByTravelerId(travelerId: string): Promise<Shipment[]> | Shipment[];
  getAvailableShipments(fromCity?: string, toCity?: string): Promise<Shipment[]> | Shipment[];

  // Quotes
  createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> | Quote;
  getQuoteById(id: string): Promise<Quote | undefined> | Quote | undefined;
  updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> | Quote | undefined;
  getQuotesForShipment(shipmentId: string): Promise<Quote[]> | Quote[];
  getQuotesByTravelerId(travelerId: string): Promise<Quote[]> | Quote[];
  getAllQuotes(): Promise<Quote[]> | Quote[];

  // Routes
  createRoute(routeData: Omit<TravelRoute, 'id' | 'createdAt'>): Promise<TravelRoute> | TravelRoute;
  getRouteById(id: string): Promise<TravelRoute | undefined> | TravelRoute | undefined;
  getRoutesByTravelerId(travelerId: string): Promise<TravelRoute[]> | TravelRoute[];
  getAllRoutes(): Promise<TravelRoute[]> | TravelRoute[];
  deleteRoute(id: string): Promise<boolean> | boolean;

  // Payments
  createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> | Payment;
  getPaymentById(id: string): Promise<Payment | undefined> | Payment | undefined;
  getPaymentByShipmentId(shipmentId: string): Promise<Payment | undefined> | Payment | undefined;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> | Payment | undefined;
  getAllPayments(): Promise<Payment[]> | Payment[];

  // KYC
  createKYCRequest(kycData: Omit<KYCRequest, 'id' | 'submittedAt' | 'status'>): Promise<KYCRequest> | KYCRequest;
  getKYCRequestById(id: string): Promise<KYCRequest | undefined> | KYCRequest | undefined;
  getKYCRequestByUserId(userId: string): Promise<KYCRequest | undefined> | KYCRequest | undefined;
  getPendingKYCRequestByUserId(userId: string): Promise<KYCRequest | undefined> | KYCRequest | undefined;
  updateKYCRequest(id: string, updates: Partial<KYCRequest>): Promise<KYCRequest | undefined> | KYCRequest | undefined;
  getAllKYCRequests(): Promise<KYCRequest[]> | KYCRequest[];
  getPendingKYCRequests(): Promise<KYCRequest[]> | KYCRequest[];
  deleteKYCRequest(id: string): Promise<boolean> | boolean;

  // Conversations
  createConversation(convData: Omit<ChatConversation, 'id' | 'createdAt' | 'updatedAt' | 'unreadCount' | 'isActive'>): Promise<ChatConversation> | ChatConversation;
  getConversationById(id: string): Promise<ChatConversation | undefined> | ChatConversation | undefined;
  getConversationByShipmentId(shipmentId: string): Promise<ChatConversation | undefined> | ChatConversation | undefined;
  updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | undefined> | ChatConversation | undefined;
  getAllConversations(): Promise<ChatConversation[]> | ChatConversation[];

  // Messages
  createMessage(msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): Promise<ChatMessage> | ChatMessage;
  getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]> | ChatMessage[];
  markMessagesAsRead(conversationId: string, userId: string): Promise<void> | void;

  // Notifications
  createNotification(notifData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> | Notification;
  getNotificationsByUserId(userId: string): Promise<Notification[]> | Notification[];
  markNotificationAsRead(id: string): Promise<Notification | undefined> | Notification | undefined;

  // Tickets
  createTicket(ticketData: Omit<EscalatedTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<EscalatedTicket> | EscalatedTicket;
  getTicketById(id: string): Promise<EscalatedTicket | undefined> | EscalatedTicket | undefined;
  updateTicket(id: string, updates: Partial<EscalatedTicket>): Promise<EscalatedTicket | undefined> | EscalatedTicket | undefined;
  getAllTickets(): Promise<EscalatedTicket[]> | EscalatedTicket[];
  getOpenTickets(): Promise<EscalatedTicket[]> | EscalatedTicket[];

  // Admin
  getAdminStats(): Promise<any> | any;
  clearAll(): Promise<void> | void;
}

class UnifiedDatabase implements DatabaseInterface {
  private inMemory = inMemoryDb;
  private supabaseAdapter: SupabaseAdapter | null = null;
  private useSupabase = false;

  constructor() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey && 
        supabaseUrl !== 'https://your-project-id.supabase.co' &&
        supabaseKey !== 'your-anon-key-here') {
      try {
        this.supabaseAdapter = new SupabaseAdapter(supabaseUrl, supabaseKey);
        this.useSupabase = true;
        console.log('[UnifiedDB] Using Supabase adapter for persistent storage');
      } catch (error) {
        console.warn('[UnifiedDB] Failed to initialize Supabase, falling back to in-memory store:', error);
        this.useSupabase = false;
      }
    } else {
      console.log('[UnifiedDB] Using in-memory store (data will not persist across restarts)');
    }
  }

  private get db() {
    return this.useSupabase && this.supabaseAdapter ? this.supabaseAdapter : this.inMemory;
  }

  // Users
  createUser(userData: Omit<User, 'id' | 'createdAt'>) { return this.db.createUser(userData); }
  getUserById(id: string) { return this.db.getUserById(id); }
  getUserByPhone(phone: string) { return this.db.getUserByPhone(phone); }
  getUserByEmail(email: string) { return this.db.getUserByEmail(email); }
  updateUser(id: string, updates: Partial<User>) { return this.db.updateUser(id, updates); }
  getAllUsers() { return this.db.getAllUsers(); }

  // Shipments
  createShipment(shipmentData: Omit<Shipment, 'id' | 'parcelRequestId' | 'createdAt' | 'updatedAt' | 'quotesCount' | 'pickupOtp' | 'deliveryOtp'>) { 
    return this.db.createShipment(shipmentData); 
  }
  getShipmentById(id: string) { return this.db.getShipmentById(id); }
  updateShipment(id: string, updates: Partial<Shipment>) { return this.db.updateShipment(id, updates); }
  getAllShipments() { return this.db.getAllShipments(); }
  getShipmentsBySenderId(senderId: string) { return this.db.getShipmentsBySenderId(senderId); }
  getShipmentsByTravelerId(travelerId: string) { return this.db.getShipmentsByTravelerId(travelerId); }
  getAvailableShipments(fromCity?: string, toCity?: string) { return this.db.getAvailableShipments(fromCity, toCity); }

  // Quotes
  createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>) { return this.db.createQuote(quoteData); }
  getQuoteById(id: string) { return this.db.getQuoteById(id); }
  updateQuote(id: string, updates: Partial<Quote>) { return this.db.updateQuote(id, updates); }
  getQuotesForShipment(shipmentId: string) { return this.db.getQuotesForShipment(shipmentId); }
  getQuotesByTravelerId(travelerId: string) { return this.db.getQuotesByTravelerId(travelerId); }
  getAllQuotes() { return this.db.getAllQuotes(); }

  // Routes
  createRoute(routeData: Omit<TravelRoute, 'id' | 'createdAt'>) { return this.db.createRoute(routeData); }
  getRouteById(id: string) { return this.db.getRouteById(id); }
  getRoutesByTravelerId(travelerId: string) { return this.db.getRoutesByTravelerId(travelerId); }
  getAllRoutes() { return this.db.getAllRoutes(); }
  deleteRoute(id: string) { return this.db.deleteRoute(id); }

  // Payments
  createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>) { return this.db.createPayment(paymentData); }
  getPaymentById(id: string) { return this.db.getPaymentById(id); }
  getPaymentByShipmentId(shipmentId: string) { return this.db.getPaymentByShipmentId(shipmentId); }
  updatePayment(id: string, updates: Partial<Payment>) { return this.db.updatePayment(id, updates); }
  getAllPayments() { return this.db.getAllPayments(); }

  // KYC
  createKYCRequest(kycData: Omit<KYCRequest, 'id' | 'submittedAt' | 'status'>) { return this.db.createKYCRequest(kycData); }
  getKYCRequestById(id: string) { return this.db.getKYCRequestById(id); }
  getKYCRequestByUserId(userId: string) { return this.db.getKYCRequestByUserId(userId); }
  getPendingKYCRequestByUserId(userId: string) { return this.db.getPendingKYCRequestByUserId(userId); }
  updateKYCRequest(id: string, updates: Partial<KYCRequest>) { return this.db.updateKYCRequest(id, updates); }
  getAllKYCRequests() { return this.db.getAllKYCRequests(); }
  getPendingKYCRequests() { return this.db.getPendingKYCRequests(); }
  deleteKYCRequest(id: string) { return this.db.deleteKYCRequest(id); }

  // Conversations
  createConversation(convData: Omit<ChatConversation, 'id' | 'createdAt' | 'updatedAt' | 'unreadCount' | 'isActive'>) { 
    return this.db.createConversation(convData); 
  }
  getConversationById(id: string) { return this.db.getConversationById(id); }
  getConversationByShipmentId(shipmentId: string) { return this.db.getConversationByShipmentId(shipmentId); }
  updateConversation(id: string, updates: Partial<ChatConversation>) { return this.db.updateConversation(id, updates); }
  getAllConversations() { return this.db.getAllConversations(); }

  // Messages
  createMessage(msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) { return this.db.createMessage(msgData); }
  getMessagesByConversationId(conversationId: string) { return this.db.getMessagesByConversationId(conversationId); }
  markMessagesAsRead(conversationId: string, userId: string) { return this.db.markMessagesAsRead(conversationId, userId); }

  // Notifications
  createNotification(notifData: Omit<Notification, 'id' | 'createdAt' | 'read'>) { return this.db.createNotification(notifData); }
  getNotificationsByUserId(userId: string) { return this.db.getNotificationsByUserId(userId); }
  markNotificationAsRead(id: string) { return this.db.markNotificationAsRead(id); }

  // Tickets
  createTicket(ticketData: Omit<EscalatedTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) { 
    return this.db.createTicket(ticketData); 
  }
  getTicketById(id: string) { return this.db.getTicketById(id); }
  updateTicket(id: string, updates: Partial<EscalatedTicket>) { return this.db.updateTicket(id, updates); }
  getAllTickets() { return this.db.getAllTickets(); }
  getOpenTickets() { return this.db.getOpenTickets(); }

  // Admin
  getAdminStats() { return this.db.getAdminStats(); }
  clearAll() { return this.db.clearAll(); }
}

export const database = new UnifiedDatabase();
