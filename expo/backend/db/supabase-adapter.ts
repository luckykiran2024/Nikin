import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

const generateTicketNumber = (): string => {
  return `SUP${Date.now().toString().slice(-6)}`;
};

export class SupabaseAdapter {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[SupabaseAdapter] Initialized with Supabase');
  }

  private transformUserFromDb(row: any): User {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      roles: row.roles || ['sender'],
      activeRole: row.active_role || 'sender',
      kycStatus: row.kyc_status || 'not_submitted',
      rating: row.rating || 5.0,
      totalDeliveries: row.total_deliveries || 0,
      totalShipments: row.total_shipments || 0,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      gender: row.gender,
      isOnline: row.is_online,
      lastSeen: row.last_seen,
      earnings: row.earnings || 0,
      aadhaarVerified: row.aadhaar_verified,
      aadhaarNumber: row.aadhaar_number,
    };
  }

  private transformUserToDb(user: Partial<User>): Record<string, any> {
    const result: Record<string, any> = {};
    if (user.name !== undefined) result.name = user.name;
    if (user.phone !== undefined) result.phone = user.phone;
    if (user.email !== undefined) result.email = user.email;
    if (user.roles !== undefined) result.roles = user.roles;
    if (user.activeRole !== undefined) result.active_role = user.activeRole;
    if (user.kycStatus !== undefined) result.kyc_status = user.kycStatus;
    if (user.rating !== undefined) result.rating = user.rating;
    if (user.totalDeliveries !== undefined) result.total_deliveries = user.totalDeliveries;
    if (user.totalShipments !== undefined) result.total_shipments = user.totalShipments;
    if (user.avatarUrl !== undefined) result.avatar_url = user.avatarUrl;
    if (user.gender !== undefined) result.gender = user.gender;
    if (user.isOnline !== undefined) result.is_online = user.isOnline;
    if (user.lastSeen !== undefined) result.last_seen = user.lastSeen;
    if (user.earnings !== undefined) result.earnings = user.earnings;
    if (user.aadhaarVerified !== undefined) result.aadhaar_verified = user.aadhaarVerified;
    if (user.aadhaarNumber !== undefined) result.aadhaar_number = user.aadhaarNumber;
    return result;
  }

  private transformShipmentFromDb(row: any): Shipment {
    return {
      id: row.id,
      parcelRequestId: row.parcel_request_id,
      senderId: row.sender_id,
      senderName: row.sender_name || '',
      senderPhone: row.sender_phone,
      receiverId: row.receiver_id,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      pickupCity: row.pickup_city,
      destinationCity: row.destination_city,
      pickupAddress: row.pickup_address,
      destinationAddress: row.destination_address,
      pickupCoords: row.pickup_coords,
      destinationCoords: row.destination_coords,
      parcelDetails: row.parcel_details || {
        description: row.description || '',
        weight: row.weight || 0,
        dimensions: '',
        category: row.category || 'general',
        estimatedValue: 0,
        fragile: false,
      },
      status: row.status || 'created',
      assignedTravelerId: row.assigned_traveler_id,
      assignedTravelerName: row.assigned_traveler_name,
      assignedTravelerPhone: row.assigned_traveler_phone,
      preferredDate: row.preferred_date || new Date().toISOString(),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pickupOtp: row.pickup_otp,
      deliveryOtp: row.delivery_otp,
      pickupOtpVerified: row.pickup_verified,
      deliveryOtpVerified: row.delivery_verified,
      quotesCount: row.quotes_count || 0,
      acceptedQuoteAmount: row.final_price,
      pickupImages: row.pickup_images,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      paymentCompleted: row.payment_completed,
      specialInstructions: row.special_instructions,
      currentLocation: row.current_location,
      trackingHistory: row.tracking_history,
      chatId: row.chat_id,
      travelerTravelMode: row.traveler_transport_mode,
      travelerDeliveryDate: row.traveler_expected_delivery,
      travelerParcelImage: row.traveler_parcel_image,
      pickupDetailsCompleted: row.pickup_details_completed,
      deliveryImages: row.delivery_images,
      deliveryConfirmedAt: row.delivery_confirmed_at,
      jobAcceptDeadline: row.job_accept_deadline,
      jobAcceptedAt: row.job_accepted_at,
      cancelledAt: row.cancelled_at,
      cancelledBy: row.cancelled_by,
      cancellationReason: row.cancellation_reason,
      cancellationNote: row.cancellation_note,
    };
  }

  private transformShipmentToDb(shipment: Partial<Shipment>): Record<string, any> {
    const result: Record<string, any> = {};
    if (shipment.senderId !== undefined) result.sender_id = shipment.senderId;
    if (shipment.senderName !== undefined) result.sender_name = shipment.senderName;
    if (shipment.senderPhone !== undefined) result.sender_phone = shipment.senderPhone;
    if (shipment.receiverName !== undefined) result.receiver_name = shipment.receiverName;
    if (shipment.receiverPhone !== undefined) result.receiver_phone = shipment.receiverPhone;
    if (shipment.pickupCity !== undefined) result.pickup_city = shipment.pickupCity;
    if (shipment.destinationCity !== undefined) result.destination_city = shipment.destinationCity;
    if (shipment.pickupAddress !== undefined) result.pickup_address = shipment.pickupAddress;
    if (shipment.destinationAddress !== undefined) result.destination_address = shipment.destinationAddress;
    if (shipment.pickupCoords !== undefined) result.pickup_coords = shipment.pickupCoords;
    if (shipment.destinationCoords !== undefined) result.destination_coords = shipment.destinationCoords;
    if (shipment.parcelDetails !== undefined) {
      result.parcel_details = shipment.parcelDetails;
      result.description = shipment.parcelDetails.description;
      result.weight = shipment.parcelDetails.weight;
      result.category = shipment.parcelDetails.category;
    }
    if (shipment.status !== undefined) result.status = shipment.status;
    if (shipment.assignedTravelerId !== undefined) result.assigned_traveler_id = shipment.assignedTravelerId;
    if (shipment.assignedTravelerName !== undefined) result.assigned_traveler_name = shipment.assignedTravelerName;
    if (shipment.assignedTravelerPhone !== undefined) result.assigned_traveler_phone = shipment.assignedTravelerPhone;
    if (shipment.preferredDate !== undefined) result.preferred_date = shipment.preferredDate;
    if (shipment.pickupOtpVerified !== undefined) result.pickup_verified = shipment.pickupOtpVerified;
    if (shipment.deliveryOtpVerified !== undefined) result.delivery_verified = shipment.deliveryOtpVerified;
    if (shipment.acceptedQuoteAmount !== undefined) result.final_price = shipment.acceptedQuoteAmount;
    if (shipment.pickupImages !== undefined) result.pickup_images = shipment.pickupImages;
    if (shipment.paymentMethod !== undefined) result.payment_method = shipment.paymentMethod;
    if (shipment.paymentStatus !== undefined) result.payment_status = shipment.paymentStatus;
    if (shipment.paymentCompleted !== undefined) result.payment_completed = shipment.paymentCompleted;
    if (shipment.specialInstructions !== undefined) result.special_instructions = shipment.specialInstructions;
    if (shipment.currentLocation !== undefined) result.current_location = shipment.currentLocation;
    if (shipment.trackingHistory !== undefined) result.tracking_history = shipment.trackingHistory;
    if (shipment.chatId !== undefined) result.chat_id = shipment.chatId;
    if (shipment.travelerTravelMode !== undefined) result.traveler_transport_mode = shipment.travelerTravelMode;
    if (shipment.travelerDeliveryDate !== undefined) result.traveler_expected_delivery = shipment.travelerDeliveryDate;
    if (shipment.travelerParcelImage !== undefined) result.traveler_parcel_image = shipment.travelerParcelImage;
    if (shipment.pickupDetailsCompleted !== undefined) result.pickup_details_completed = shipment.pickupDetailsCompleted;
    if (shipment.deliveryImages !== undefined) result.delivery_images = shipment.deliveryImages;
    if (shipment.deliveryConfirmedAt !== undefined) result.delivery_confirmed_at = shipment.deliveryConfirmedAt;
    if (shipment.deliveryOtp !== undefined) result.delivery_otp = shipment.deliveryOtp;
    if (shipment.jobAcceptDeadline !== undefined) result.job_accept_deadline = shipment.jobAcceptDeadline;
    if (shipment.jobAcceptedAt !== undefined) result.job_accepted_at = shipment.jobAcceptedAt;
    if (shipment.cancelledAt !== undefined) result.cancelled_at = shipment.cancelledAt;
    if (shipment.cancelledBy !== undefined) result.cancelled_by = shipment.cancelledBy;
    if (shipment.cancellationReason !== undefined) result.cancellation_reason = shipment.cancellationReason;
    if (shipment.cancellationNote !== undefined) result.cancellation_note = shipment.cancellationNote;
    return result;
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const dbData = this.transformUserToDb(userData);
    const { data, error } = await this.supabase
      .from('users')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('[SupabaseAdapter] Error creating user:', error);
      throw error;
    }
    console.log('[SupabaseAdapter] Created user:', data.id);
    return this.transformUserFromDb(data);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformUserFromDb(data);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error || !data) return undefined;
    return this.transformUserFromDb(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return this.transformUserFromDb(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const dbData = this.transformUserToDb(updates);
    const { data, error } = await this.supabase
      .from('users')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    console.log('[SupabaseAdapter] Updated user:', id);
    return this.transformUserFromDb(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformUserFromDb(row));
  }

  // Shipments
  async createShipment(shipmentData: Omit<Shipment, 'id' | 'parcelRequestId' | 'createdAt' | 'updatedAt' | 'quotesCount' | 'pickupOtp' | 'deliveryOtp'>): Promise<Shipment> {
    const dbData = this.transformShipmentToDb(shipmentData);
    dbData.parcel_request_id = generateParcelRequestId();
    dbData.pickup_otp = generateOTP();
    dbData.delivery_otp = generateOTP();
    dbData.quotes_count = 0;
    
    const { data, error } = await this.supabase
      .from('shipments')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('[SupabaseAdapter] Error creating shipment:', error);
      throw error;
    }
    console.log('[SupabaseAdapter] Created shipment:', data.parcel_request_id);
    return this.transformShipmentFromDb(data);
  }

  async getShipmentById(id: string): Promise<Shipment | undefined> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformShipmentFromDb(data);
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment | undefined> {
    const dbData = this.transformShipmentToDb(updates);
    dbData.updated_at = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('shipments')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    console.log('[SupabaseAdapter] Updated shipment:', id);
    return this.transformShipmentFromDb(data);
  }

  async getAllShipments(): Promise<Shipment[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformShipmentFromDb(row));
  }

  async getShipmentsBySenderId(senderId: string): Promise<Shipment[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformShipmentFromDb(row));
  }

  async getShipmentsByTravelerId(travelerId: string): Promise<Shipment[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*')
      .eq('assigned_traveler_id', travelerId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformShipmentFromDb(row));
  }

  async getAvailableShipments(fromCity?: string, toCity?: string): Promise<Shipment[]> {
    let query = this.supabase
      .from('shipments')
      .select('*')
      .in('status', ['created', 'quoted']);
    
    if (fromCity) query = query.eq('pickup_city', fromCity);
    if (toCity) query = query.eq('destination_city', toCity);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(row => this.transformShipmentFromDb(row));
  }

  // Quotes
  async createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> {
    const { data, error } = await this.supabase
      .from('quotes')
      .insert({
        shipment_id: quoteData.shipmentId,
        traveler_id: quoteData.travelerId,
        traveler_name: quoteData.travelerName,
        traveler_rating: quoteData.travelerRating,
        traveler_deliveries: quoteData.travelerDeliveries,
        price: quoteData.amount,
        estimated_delivery: quoteData.estimatedDelivery,
        message: quoteData.message,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;

    // Update shipment quotes count
    await this.supabase.rpc('increment_quotes_count', { shipment_uuid: quoteData.shipmentId });
    
    console.log('[SupabaseAdapter] Created quote:', data.id);
    return this.transformQuoteFromDb(data);
  }

  private transformQuoteFromDb(row: any): Quote {
    return {
      id: row.id,
      shipmentId: row.shipment_id,
      travelerId: row.traveler_id,
      travelerName: row.traveler_name || '',
      travelerRating: row.traveler_rating || 5,
      travelerDeliveries: row.traveler_deliveries || 0,
      amount: row.price,
      estimatedDelivery: row.estimated_delivery,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async getQuoteById(id: string): Promise<Quote | undefined> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformQuoteFromDb(data);
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const dbData: Record<string, any> = {};
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.amount !== undefined) dbData.price = updates.amount;
    
    const { data, error } = await this.supabase
      .from('quotes')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformQuoteFromDb(data);
  }

  async getQuotesForShipment(shipmentId: string): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformQuoteFromDb(row));
  }

  async getQuotesByTravelerId(travelerId: string): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformQuoteFromDb(row));
  }

  async getAllQuotes(): Promise<Quote[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformQuoteFromDb(row));
  }

  // Travel Routes
  async createRoute(routeData: Omit<TravelRoute, 'id' | 'createdAt'>): Promise<TravelRoute> {
    const { data, error } = await this.supabase
      .from('travel_routes')
      .insert({
        traveler_id: routeData.travelerId,
        traveler_name: routeData.travelerName,
        from_city: routeData.fromCity,
        to_city: routeData.toCity,
        travel_date: routeData.travelDate,
        description: routeData.description,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    console.log('[SupabaseAdapter] Created route:', data.id);
    return this.transformRouteFromDb(data);
  }

  private transformRouteFromDb(row: any): TravelRoute {
    return {
      id: row.id,
      travelerId: row.traveler_id,
      travelerName: row.traveler_name || '',
      fromCity: row.from_city,
      toCity: row.to_city,
      travelDate: row.travel_date,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  async getRouteById(id: string): Promise<TravelRoute | undefined> {
    const { data, error } = await this.supabase
      .from('travel_routes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformRouteFromDb(data);
  }

  async getRoutesByTravelerId(travelerId: string): Promise<TravelRoute[]> {
    const { data, error } = await this.supabase
      .from('travel_routes')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('travel_date', { ascending: true });
    
    if (error || !data) return [];
    return data.map(row => this.transformRouteFromDb(row));
  }

  async getAllRoutes(): Promise<TravelRoute[]> {
    const { data, error } = await this.supabase
      .from('travel_routes')
      .select('*')
      .order('travel_date', { ascending: true });
    
    if (error || !data) return [];
    return data.map(row => this.transformRouteFromDb(row));
  }

  async deleteRoute(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('travel_routes')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Payments
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        shipment_id: paymentData.shipmentId,
        sender_id: paymentData.senderId,
        traveler_id: paymentData.travelerId,
        amount: paymentData.amount,
        platform_fee: paymentData.platformFee,
        traveler_payout: paymentData.travelerAmount,
        payment_method: paymentData.method,
        status: paymentData.status,
        payout_status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    console.log('[SupabaseAdapter] Created payment:', data.id);
    return this.transformPaymentFromDb(data);
  }

  private transformPaymentFromDb(row: any): Payment {
    return {
      id: row.id,
      shipmentId: row.shipment_id,
      senderId: row.sender_id,
      travelerId: row.traveler_id,
      amount: row.amount,
      platformFee: row.platform_fee,
      travelerAmount: row.traveler_payout,
      method: row.payment_method || 'upi',
      status: row.status,
      escrowHeld: row.payout_status === 'pending',
      createdAt: row.created_at,
      completedAt: row.completed_at,
      releasedAt: row.released_at,
    };
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformPaymentFromDb(data);
  }

  async getPaymentByShipmentId(shipmentId: string): Promise<Payment | undefined> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('shipment_id', shipmentId)
      .single();
    
    if (error || !data) return undefined;
    return this.transformPaymentFromDb(data);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const dbData: Record<string, any> = {};
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.escrowHeld !== undefined) dbData.payout_status = updates.escrowHeld ? 'pending' : 'released';
    if (updates.completedAt !== undefined) dbData.completed_at = updates.completedAt;
    if (updates.releasedAt !== undefined) dbData.released_at = updates.releasedAt;
    
    const { data, error } = await this.supabase
      .from('payments')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformPaymentFromDb(data);
  }

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformPaymentFromDb(row));
  }

  // KYC Requests
  async createKYCRequest(kycData: Omit<KYCRequest, 'id' | 'submittedAt' | 'status'>): Promise<KYCRequest> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .insert({
        user_id: kycData.userId,
        document_type: 'aadhaar',
        document_number: kycData.aadhaarNumber,
        document_front_image: '',
        selfie_image: '',
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    console.log('[SupabaseAdapter] Created KYC request:', data.id);
    return this.transformKYCFromDb(data, kycData);
  }

  private transformKYCFromDb(row: any, originalData?: any): KYCRequest {
    return {
      id: row.id,
      userId: row.user_id,
      userName: originalData?.userName || '',
      userEmail: originalData?.userEmail || '',
      userPhone: originalData?.userPhone || '',
      userRole: originalData?.userRole || 'sender',
      avatar: originalData?.avatar,
      aadhaarNumber: row.document_number,
      panNumber: originalData?.panNumber || '',
      passportNumber: originalData?.passportNumber,
      drivingLicenseNumber: originalData?.drivingLicenseNumber,
      selfieUploaded: !!row.selfie_image,
      submittedAt: row.submitted_at,
      status: row.status,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
    };
  }

  async getKYCRequestById(id: string): Promise<KYCRequest | undefined> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformKYCFromDb(data);
  }

  async getKYCRequestByUserId(userId: string): Promise<KYCRequest | undefined> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return undefined;
    return this.transformKYCFromDb(data);
  }

  async getPendingKYCRequestByUserId(userId: string): Promise<KYCRequest | undefined> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (error || !data) return undefined;
    return this.transformKYCFromDb(data);
  }

  async updateKYCRequest(id: string, updates: Partial<KYCRequest>): Promise<KYCRequest | undefined> {
    const dbData: Record<string, any> = {};
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.reviewedAt !== undefined) dbData.reviewed_at = updates.reviewedAt;
    if (updates.rejectionReason !== undefined) dbData.rejection_reason = updates.rejectionReason;
    
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformKYCFromDb(data);
  }

  async getAllKYCRequests(): Promise<KYCRequest[]> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformKYCFromDb(row));
  }

  async getPendingKYCRequests(): Promise<KYCRequest[]> {
    const { data, error } = await this.supabase
      .from('kyc_requests')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    
    if (error || !data) return [];
    return data.map(row => this.transformKYCFromDb(row));
  }

  async deleteKYCRequest(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('kyc_requests')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Conversations
  async createConversation(convData: Omit<ChatConversation, 'id' | 'createdAt' | 'updatedAt' | 'unreadCount' | 'isActive'>): Promise<ChatConversation> {
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .insert({
        shipment_id: convData.shipmentId,
        participants: convData.participants,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.transformConversationFromDb(data);
  }

  private transformConversationFromDb(row: any): ChatConversation {
    return {
      id: row.id,
      type: 'sender_traveler',
      participants: row.participants || [],
      shipmentId: row.shipment_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unreadCount: row.unread_count || {},
      isActive: row.is_active,
    };
  }

  async getConversationById(id: string): Promise<ChatConversation | undefined> {
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformConversationFromDb(data);
  }

  async getConversationByShipmentId(shipmentId: string): Promise<ChatConversation | undefined> {
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .select('*')
      .eq('shipment_id', shipmentId)
      .eq('is_active', true)
      .single();
    
    if (error || !data) return undefined;
    return this.transformConversationFromDb(data);
  }

  async updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const dbData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.isActive !== undefined) dbData.is_active = updates.isActive;
    
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformConversationFromDb(data);
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformConversationFromDb(row));
  }

  // Messages
  async createMessage(msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        conversation_id: msgData.conversationId,
        sender_id: msgData.senderId,
        content: msgData.text,
        message_type: 'text',
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.transformMessageFromDb(data, msgData);
  }

  private transformMessageFromDb(row: any, originalData?: any): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      senderName: originalData?.senderName || '',
      senderRole: originalData?.senderRole || 'sender',
      text: row.content,
      timestamp: row.timestamp,
      read: row.read,
      imageUrl: originalData?.imageUrl,
      isSystemMessage: originalData?.isSystemMessage,
    };
  }

  async getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error || !data) return [];
    return data.map(row => this.transformMessageFromDb(row));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  }

  // Notifications
  async createNotification(notifData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: notifData.userId,
        title: notifData.title,
        message: notifData.message,
        type: notifData.type,
        data: notifData.data,
        read: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.transformNotificationFromDb(data);
  }

  private transformNotificationFromDb(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.read,
      createdAt: row.created_at,
      data: row.data,
    };
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformNotificationFromDb(row));
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformNotificationFromDb(data);
  }

  // Tickets
  async createTicket(ticketData: Omit<EscalatedTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<EscalatedTicket> {
    const { data, error } = await this.supabase
      .from('escalated_tickets')
      .insert({
        ticket_number: generateTicketNumber(),
        shipment_id: ticketData.conversationId,
        user_id: ticketData.userId,
        category: ticketData.category,
        priority: ticketData.priority,
        subject: ticketData.description?.substring(0, 100) || 'Support Request',
        description: ticketData.description,
        status: 'open',
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.transformTicketFromDb(data, ticketData);
  }

  private transformTicketFromDb(row: any, originalData?: any): EscalatedTicket {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      userName: originalData?.userName || '',
      userRole: originalData?.userRole || 'sender',
      category: row.category,
      subcategory: originalData?.subcategory,
      description: row.description,
      status: row.status,
      priority: row.priority || 'medium',
      assignedAdminId: row.assigned_to,
      conversationId: row.shipment_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      resolution: row.resolution,
    };
  }

  async getTicketById(id: string): Promise<EscalatedTicket | undefined> {
    const { data, error } = await this.supabase
      .from('escalated_tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.transformTicketFromDb(data);
  }

  async updateTicket(id: string, updates: Partial<EscalatedTicket>): Promise<EscalatedTicket | undefined> {
    const dbData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.resolution !== undefined) dbData.resolution = updates.resolution;
    if (updates.resolvedAt !== undefined) dbData.resolved_at = updates.resolvedAt;
    
    const { data, error } = await this.supabase
      .from('escalated_tickets')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.transformTicketFromDb(data);
  }

  async getAllTickets(): Promise<EscalatedTicket[]> {
    const { data, error } = await this.supabase
      .from('escalated_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformTicketFromDb(row));
  }

  async getOpenTickets(): Promise<EscalatedTicket[]> {
    const { data, error } = await this.supabase
      .from('escalated_tickets')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(row => this.transformTicketFromDb(row));
  }

  // Admin Stats
  async getAdminStats() {
    const [users, shipments, kycRequests, payments, tickets] = await Promise.all([
      this.supabase.from('users').select('*'),
      this.supabase.from('shipments').select('*'),
      this.supabase.from('kyc_requests').select('*'),
      this.supabase.from('payments').select('*'),
      this.supabase.from('escalated_tickets').select('*'),
    ]);

    const usersData = users.data || [];
    const shipmentsData = shipments.data || [];
    const kycData = kycRequests.data || [];
    const paymentsData = payments.data || [];
    const ticketsData = tickets.data || [];

    const completedPayments = paymentsData.filter((p: any) => p.status === 'completed');
    const now = new Date();
    const monthlyPayments = completedPayments.filter((p: any) => {
      const paymentDate = new Date(p.created_at);
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });

    return {
      totalUsers: usersData.length,
      totalSenders: usersData.filter((u: any) => u.roles?.includes('sender')).length,
      totalTravelers: usersData.filter((u: any) => u.roles?.includes('traveler')).length,
      activeShipments: shipmentsData.filter((s: any) => !['completed', 'delivered'].includes(s.status)).length,
      completedShipments: shipmentsData.filter((s: any) => s.status === 'completed' || s.status === 'delivered').length,
      pendingKYC: kycData.filter((k: any) => k.status === 'pending').length,
      approvedKYC: kycData.filter((k: any) => k.status === 'approved').length,
      rejectedKYC: kycData.filter((k: any) => k.status === 'rejected').length,
      totalRevenue: completedPayments.reduce((sum: number, p: any) => sum + (p.platform_fee || 0), 0),
      monthlyRevenue: monthlyPayments.reduce((sum: number, p: any) => sum + (p.platform_fee || 0), 0),
      platformCommission: 10,
      openTickets: ticketsData.filter((t: any) => t.status === 'open').length,
      resolvedTickets: ticketsData.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length,
    };
  }

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    console.log('[SupabaseAdapter] Clear all data not supported in production');
  }
}
