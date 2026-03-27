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

const generateParcelRequestId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `PRC${year}${month}${day}${hour}${random}`;
};

const generateOTP = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

interface Database {
  users: Map<string, User>;
  shipments: Map<string, Shipment>;
  quotes: Map<string, Quote>;
  routes: Map<string, TravelRoute>;
  conversations: Map<string, ChatConversation>;
  messages: Map<string, ChatMessage>;
  notifications: Map<string, Notification>;
  tickets: Map<string, EscalatedTicket>;
  payments: Map<string, Payment>;
  kycRequests: Map<string, KYCRequest>;
}

class InMemoryStore {
  private db: Database = {
    users: new Map(),
    shipments: new Map(),
    quotes: new Map(),
    routes: new Map(),
    conversations: new Map(),
    messages: new Map(),
    notifications: new Map(),
    tickets: new Map(),
    payments: new Map(),
    kycRequests: new Map(),
  };

  // Users
  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.db.users.set(id, user);
    console.log('[DB] Created user:', id, user.name);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.db.users.get(id);
  }

  getUserByPhone(phone: string): User | undefined {
    return Array.from(this.db.users.values()).find(u => u.phone === phone);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.db.users.values()).find(u => u.email === email);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.db.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.db.users.set(id, updated);
    console.log('[DB] Updated user:', id);
    return updated;
  }

  getAllUsers(): User[] {
    return Array.from(this.db.users.values());
  }

  // Shipments
  createShipment(shipmentData: Omit<Shipment, 'id' | 'parcelRequestId' | 'createdAt' | 'updatedAt' | 'quotesCount' | 'pickupOtp' | 'deliveryOtp'>): Shipment {
    const id = `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shipment: Shipment = {
      ...shipmentData,
      id,
      parcelRequestId: generateParcelRequestId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 0,
      pickupOtp: generateOTP(),
      deliveryOtp: generateOTP(),
    };
    this.db.shipments.set(id, shipment);
    console.log('[DB] Created shipment:', shipment.parcelRequestId);
    return shipment;
  }

  getShipmentById(id: string): Shipment | undefined {
    return this.db.shipments.get(id);
  }

  updateShipment(id: string, updates: Partial<Shipment>): Shipment | undefined {
    const shipment = this.db.shipments.get(id);
    if (!shipment) return undefined;
    const updated = { ...shipment, ...updates, updatedAt: new Date().toISOString() };
    this.db.shipments.set(id, updated);
    console.log('[DB] Updated shipment:', id, 'status:', updated.status);
    return updated;
  }

  getAllShipments(): Shipment[] {
    return Array.from(this.db.shipments.values());
  }

  getShipmentsBySenderId(senderId: string): Shipment[] {
    return Array.from(this.db.shipments.values()).filter(s => s.senderId === senderId);
  }

  getShipmentsByTravelerId(travelerId: string): Shipment[] {
    return Array.from(this.db.shipments.values()).filter(s => s.assignedTravelerId === travelerId);
  }

  getAvailableShipments(fromCity?: string, toCity?: string): Shipment[] {
    return Array.from(this.db.shipments.values()).filter(s => {
      if (s.status !== 'created' && s.status !== 'quoted') return false;
      if (fromCity && s.pickupCity !== fromCity) return false;
      if (toCity && s.destinationCity !== toCity) return false;
      return true;
    });
  }

  // Quotes
  createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Quote {
    const id = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const quote: Quote = {
      ...quoteData,
      id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.db.quotes.set(id, quote);
    
    // Update shipment quotes count
    const shipment = this.db.shipments.get(quoteData.shipmentId);
    if (shipment) {
      this.updateShipment(quoteData.shipmentId, {
        quotesCount: shipment.quotesCount + 1,
        status: shipment.status === 'created' ? 'quoted' : shipment.status,
      });
    }
    
    console.log('[DB] Created quote:', id, 'for shipment:', quoteData.shipmentId);
    return quote;
  }

  getQuoteById(id: string): Quote | undefined {
    return this.db.quotes.get(id);
  }

  updateQuote(id: string, updates: Partial<Quote>): Quote | undefined {
    const quote = this.db.quotes.get(id);
    if (!quote) return undefined;
    const updated = { ...quote, ...updates };
    this.db.quotes.set(id, updated);
    console.log('[DB] Updated quote:', id, 'status:', updated.status);
    return updated;
  }

  getQuotesForShipment(shipmentId: string): Quote[] {
    return Array.from(this.db.quotes.values()).filter(q => q.shipmentId === shipmentId);
  }

  getQuotesByTravelerId(travelerId: string): Quote[] {
    return Array.from(this.db.quotes.values()).filter(q => q.travelerId === travelerId);
  }

  getAllQuotes(): Quote[] {
    return Array.from(this.db.quotes.values());
  }

  // Travel Routes
  createRoute(routeData: Omit<TravelRoute, 'id' | 'createdAt'>): TravelRoute {
    const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const route: TravelRoute = {
      ...routeData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.db.routes.set(id, route);
    console.log('[DB] Created route:', id);
    return route;
  }

  getRouteById(id: string): TravelRoute | undefined {
    return this.db.routes.get(id);
  }

  getRoutesByTravelerId(travelerId: string): TravelRoute[] {
    return Array.from(this.db.routes.values()).filter(r => r.travelerId === travelerId);
  }

  getAllRoutes(): TravelRoute[] {
    return Array.from(this.db.routes.values());
  }

  deleteRoute(id: string): boolean {
    return this.db.routes.delete(id);
  }

  // Payments
  createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payment: Payment = {
      ...paymentData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.db.payments.set(id, payment);
    console.log('[DB] Created payment:', id, 'for shipment:', paymentData.shipmentId);
    return payment;
  }

  getPaymentById(id: string): Payment | undefined {
    return this.db.payments.get(id);
  }

  getPaymentByShipmentId(shipmentId: string): Payment | undefined {
    return Array.from(this.db.payments.values()).find(p => p.shipmentId === shipmentId);
  }

  updatePayment(id: string, updates: Partial<Payment>): Payment | undefined {
    const payment = this.db.payments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, ...updates };
    this.db.payments.set(id, updated);
    console.log('[DB] Updated payment:', id, 'status:', updated.status);
    return updated;
  }

  getAllPayments(): Payment[] {
    return Array.from(this.db.payments.values());
  }

  // KYC Requests
  createKYCRequest(kycData: Omit<KYCRequest, 'id' | 'submittedAt' | 'status'>): KYCRequest {
    const id = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const kyc: KYCRequest = {
      ...kycData,
      id,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.db.kycRequests.set(id, kyc);
    console.log('[DB] Created KYC request:', id, 'for user:', kycData.userId);
    return kyc;
  }

  getKYCRequestById(id: string): KYCRequest | undefined {
    return this.db.kycRequests.get(id);
  }

  getKYCRequestByUserId(userId: string): KYCRequest | undefined {
    return Array.from(this.db.kycRequests.values()).find(k => k.userId === userId);
  }

  getPendingKYCRequestByUserId(userId: string): KYCRequest | undefined {
    return Array.from(this.db.kycRequests.values()).find(k => k.userId === userId && k.status === 'pending');
  }

  updateKYCRequest(id: string, updates: Partial<KYCRequest>): KYCRequest | undefined {
    const kyc = this.db.kycRequests.get(id);
    if (!kyc) return undefined;
    const updated = { ...kyc, ...updates };
    this.db.kycRequests.set(id, updated);
    console.log('[DB] Updated KYC request:', id, 'status:', updated.status);
    return updated;
  }

  getAllKYCRequests(): KYCRequest[] {
    return Array.from(this.db.kycRequests.values());
  }

  getPendingKYCRequests(): KYCRequest[] {
    return Array.from(this.db.kycRequests.values()).filter(k => k.status === 'pending');
  }

  deleteKYCRequest(id: string): boolean {
    return this.db.kycRequests.delete(id);
  }

  // Chat Conversations
  createConversation(convData: Omit<ChatConversation, 'id' | 'createdAt' | 'updatedAt' | 'unreadCount' | 'isActive'>): ChatConversation {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: ChatConversation = {
      ...convData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: {},
      isActive: true,
    };
    this.db.conversations.set(id, conversation);
    console.log('[DB] Created conversation:', id);
    return conversation;
  }

  getConversationById(id: string): ChatConversation | undefined {
    return this.db.conversations.get(id);
  }

  getConversationByShipmentId(shipmentId: string): ChatConversation | undefined {
    return Array.from(this.db.conversations.values()).find(c => c.shipmentId === shipmentId && c.isActive);
  }

  updateConversation(id: string, updates: Partial<ChatConversation>): ChatConversation | undefined {
    const conv = this.db.conversations.get(id);
    if (!conv) return undefined;
    const updated = { ...conv, ...updates, updatedAt: new Date().toISOString() };
    this.db.conversations.set(id, updated);
    return updated;
  }

  getAllConversations(): ChatConversation[] {
    return Array.from(this.db.conversations.values());
  }

  // Chat Messages
  createMessage(msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): ChatMessage {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: ChatMessage = {
      ...msgData,
      id,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.db.messages.set(id, message);
    
    // Update conversation last message
    const conv = this.db.conversations.get(msgData.conversationId);
    if (conv) {
      this.updateConversation(msgData.conversationId, { lastMessage: message });
    }
    
    console.log('[DB] Created message:', id);
    return message;
  }

  getMessagesByConversationId(conversationId: string): ChatMessage[] {
    return Array.from(this.db.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  markMessagesAsRead(conversationId: string, userId: string): void {
    Array.from(this.db.messages.values())
      .filter(m => m.conversationId === conversationId && m.senderId !== userId)
      .forEach(m => {
        this.db.messages.set(m.id, { ...m, read: true });
      });
  }

  // Notifications
  createNotification(notifData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      ...notifData,
      id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.db.notifications.set(id, notification);
    console.log('[DB] Created notification:', id, 'for user:', notifData.userId);
    return notification;
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return Array.from(this.db.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationAsRead(id: string): Notification | undefined {
    const notif = this.db.notifications.get(id);
    if (!notif) return undefined;
    const updated = { ...notif, read: true };
    this.db.notifications.set(id, updated);
    return updated;
  }

  // Tickets
  createTicket(ticketData: Omit<EscalatedTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): EscalatedTicket {
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ticketNumber = `SUP${Date.now().toString().slice(-6)}`;
    const ticket: EscalatedTicket = {
      ...ticketData,
      id,
      ticketNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.tickets.set(id, ticket);
    console.log('[DB] Created ticket:', ticketNumber);
    return ticket;
  }

  getTicketById(id: string): EscalatedTicket | undefined {
    return this.db.tickets.get(id);
  }

  updateTicket(id: string, updates: Partial<EscalatedTicket>): EscalatedTicket | undefined {
    const ticket = this.db.tickets.get(id);
    if (!ticket) return undefined;
    const updated = { ...ticket, ...updates, updatedAt: new Date().toISOString() };
    this.db.tickets.set(id, updated);
    return updated;
  }

  getAllTickets(): EscalatedTicket[] {
    return Array.from(this.db.tickets.values());
  }

  getOpenTickets(): EscalatedTicket[] {
    return Array.from(this.db.tickets.values()).filter(t => t.status === 'open' || t.status === 'in_progress');
  }

  // Admin Stats
  getAdminStats() {
    const users = this.getAllUsers();
    const shipments = this.getAllShipments();
    const kycRequests = this.getAllKYCRequests();
    const payments = this.getAllPayments();
    const tickets = this.getAllTickets();

    return {
      totalUsers: users.length,
      totalSenders: users.filter(u => u.roles.includes('sender')).length,
      totalTravelers: users.filter(u => u.roles.includes('traveler')).length,
      activeShipments: shipments.filter(s => !['completed', 'delivered'].includes(s.status)).length,
      completedShipments: shipments.filter(s => s.status === 'completed' || s.status === 'delivered').length,
      pendingKYC: kycRequests.filter(k => k.status === 'pending').length,
      approvedKYC: kycRequests.filter(k => k.status === 'approved').length,
      rejectedKYC: kycRequests.filter(k => k.status === 'rejected').length,
      totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.platformFee, 0),
      monthlyRevenue: payments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        const now = new Date();
        return p.status === 'completed' && 
               paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear();
      }).reduce((sum, p) => sum + p.platformFee, 0),
      platformCommission: 10,
      openTickets: tickets.filter(t => t.status === 'open').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    };
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.db.users.clear();
    this.db.shipments.clear();
    this.db.quotes.clear();
    this.db.routes.clear();
    this.db.conversations.clear();
    this.db.messages.clear();
    this.db.notifications.clear();
    this.db.tickets.clear();
    this.db.payments.clear();
    this.db.kycRequests.clear();
    console.log('[DB] All data cleared');
  }
}

export const db = new InMemoryStore();
