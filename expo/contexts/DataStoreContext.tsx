import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Shipment,
  Quote,
  TravelRoute,
  ChatMessage,
  Notification,
  EscalatedTicket,
  Payment,
  GeoCoordinates,
  UserRole,
} from '@/types';

export const [DataStoreProvider, useDataStore] = createContextHook(() => {
  const utils = trpc.useUtils();

  // Queries
  const shipmentsQuery = trpc.shipments.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const quotesQuery = trpc.quotes.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const routesQuery = trpc.travelRoutes.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const conversationsQuery = trpc.chat.getAllConversations.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const paymentsQuery = trpc.payments.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const kycRequestsQuery = trpc.kyc.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Mutations
  const createShipmentMutation = trpc.shipments.create.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const updateShipmentMutation = trpc.shipments.update.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const updateShipmentLocationMutation = trpc.shipments.updateLocation.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const verifyPickupOTPMutation = trpc.shipments.verifyPickupOTP.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const verifyDeliveryOTPMutation = trpc.shipments.verifyDeliveryOTP.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
      utils.payments.getAll.invalidate();
    },
  });

  const markOutForDeliveryMutation = trpc.shipments.markOutForDelivery.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const acceptJobMutation = trpc.shipments.acceptJob.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
    },
  });

  const declineJobMutation = trpc.shipments.declineJob.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
      utils.quotes.getAll.invalidate();
    },
  });

  const autoCancelAcceptanceMutation = trpc.shipments.autoCancelExpiredAcceptance.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
      utils.quotes.getAll.invalidate();
    },
  });

  const cancelShipmentMutation = trpc.shipments.cancel.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
      utils.quotes.getAll.invalidate();
    },
  });

  const createQuoteMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      utils.quotes.getAll.invalidate();
      utils.shipments.getAll.invalidate();
    },
  });

  const acceptQuoteMutation = trpc.quotes.accept.useMutation({
    onSuccess: () => {
      utils.quotes.getAll.invalidate();
      utils.shipments.getAll.invalidate();
      utils.chat.getAllConversations.invalidate();
    },
  });

  const createRouteMutation = trpc.travelRoutes.create.useMutation({
    onSuccess: () => {
      utils.travelRoutes.getAll.invalidate();
    },
  });

  const createConversationMutation = trpc.chat.createConversation.useMutation({
    onSuccess: () => {
      utils.chat.getAllConversations.invalidate();
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getAllConversations.invalidate();
    },
  });

  const createTicketMutation = trpc.tickets.create.useMutation();

  const updateTicketMutation = trpc.tickets.update.useMutation();

  const createNotificationMutation = trpc.notifications.create.useMutation();

  const markNotificationReadMutation = trpc.notifications.markAsRead.useMutation();

  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      utils.payments.getAll.invalidate();
    },
  });

  const completePaymentMutation = trpc.payments.complete.useMutation({
    onSuccess: () => {
      utils.payments.getAll.invalidate();
      utils.shipments.getAll.invalidate();
    },
  });

  const submitKYCMutation = trpc.kyc.submit.useMutation({
    onSuccess: () => {
      utils.kyc.getAll.invalidate();
    },
  });

  const cancelKYCMutation = trpc.kyc.cancel.useMutation({
    onSuccess: () => {
      utils.kyc.getAll.invalidate();
    },
  });

  const approveKYCMutation = trpc.kyc.approve.useMutation({
    onSuccess: () => {
      utils.kyc.getAll.invalidate();
    },
  });

  const rejectKYCMutation = trpc.kyc.reject.useMutation({
    onSuccess: () => {
      utils.kyc.getAll.invalidate();
    },
  });

  const clearAllDataMutation = trpc.admin.clearAllData.useMutation({
    onSuccess: () => {
      utils.shipments.getAll.invalidate();
      utils.quotes.getAll.invalidate();
      utils.travelRoutes.getAll.invalidate();
      utils.payments.getAll.invalidate();
      utils.kyc.getAll.invalidate();
      utils.chat.getAllConversations.invalidate();
    },
  });

  // Data - memoized to prevent unnecessary re-renders
  const shipments = useMemo(() => shipmentsQuery.data ?? [], [shipmentsQuery.data]);
  const quotes = useMemo(() => quotesQuery.data ?? [], [quotesQuery.data]);
  const routes = useMemo(() => routesQuery.data ?? [], [routesQuery.data]);
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);
  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);
  const kycRequests = useMemo(() => kycRequestsQuery.data ?? [], [kycRequestsQuery.data]);
  const isLoading = shipmentsQuery.isLoading || quotesQuery.isLoading;

  // Shipment functions
  const createShipment = useCallback(async (shipmentData: Omit<Shipment, 'id' | 'parcelRequestId' | 'createdAt' | 'updatedAt' | 'quotesCount' | 'pickupOtp' | 'deliveryOtp'>) => {
    const result = await createShipmentMutation.mutateAsync(shipmentData);
    if (result.success && result.shipment) {
      console.log('Created shipment:', result.shipment.parcelRequestId);
      return result.shipment;
    }
    throw new Error('Failed to create shipment');
  }, [createShipmentMutation]);

  const updateShipment = useCallback(async (shipmentId: string, updates: Partial<Shipment>) => {
    const result = await updateShipmentMutation.mutateAsync({ id: shipmentId, ...updates });
    if (result.success) {
      console.log('Updated shipment:', shipmentId);
    }
  }, [updateShipmentMutation]);

  const updateShipmentLocation = useCallback(async (shipmentId: string, coords: GeoCoordinates) => {
    await updateShipmentLocationMutation.mutateAsync({ id: shipmentId, coords });
  }, [updateShipmentLocationMutation]);

  const verifyPickupOTP = useCallback(async (shipmentId: string, otp: string): Promise<boolean> => {
    const result = await verifyPickupOTPMutation.mutateAsync({ id: shipmentId, otp });
    return result.success;
  }, [verifyPickupOTPMutation]);

  const verifyDeliveryOTP = useCallback(async (shipmentId: string, otp: string, deliveryImages?: string[]): Promise<boolean> => {
    const result = await verifyDeliveryOTPMutation.mutateAsync({ id: shipmentId, otp, deliveryImages });
    return result.success;
  }, [verifyDeliveryOTPMutation]);

  const markOutForDelivery = useCallback(async (shipmentId: string): Promise<{ success: boolean; deliveryOtp?: string }> => {
    const result = await markOutForDeliveryMutation.mutateAsync({ id: shipmentId });
    return { success: result.success, deliveryOtp: result.deliveryOtp };
  }, [markOutForDeliveryMutation]);

  const acceptJob = useCallback(async (shipmentId: string, travelerId: string) => {
    const result = await acceptJobMutation.mutateAsync({ id: shipmentId, travelerId });
    if (!result.success) throw new Error(result.error || 'Failed to accept job');
    return result.shipment;
  }, [acceptJobMutation]);

  const declineJob = useCallback(async (shipmentId: string, travelerId: string, reason?: string) => {
    const result = await declineJobMutation.mutateAsync({ id: shipmentId, travelerId, reason });
    if (!result.success) throw new Error(result.error || 'Failed to decline job');
    return result.shipment;
  }, [declineJobMutation]);

  const autoCancelAcceptance = useCallback(async (shipmentId: string) => {
    try {
      await autoCancelAcceptanceMutation.mutateAsync({ id: shipmentId });
    } catch (e) {
      console.log('[autoCancelAcceptance] ignored', e);
    }
  }, [autoCancelAcceptanceMutation]);

  const cancelShipment = useCallback(async (
    shipmentId: string,
    userId: string,
    reason: 'user_cancelled' | 'traveler_declined' | 'traveler_timeout' | 'admin_cancelled' | 'other' = 'user_cancelled',
    note?: string,
  ) => {
    const result = await cancelShipmentMutation.mutateAsync({ id: shipmentId, userId, reason, note });
    if (!result.success) throw new Error(result.error || 'Failed to cancel shipment');
    return result.shipment;
  }, [cancelShipmentMutation]);

  // Quote functions
  const createQuote = useCallback(async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>) => {
    const result = await createQuoteMutation.mutateAsync(quoteData);
    if (result.success && result.quote) {
      console.log('Created quote:', result.quote.id);
      return result.quote;
    }
    throw new Error(result.error || 'Failed to create quote');
  }, [createQuoteMutation]);

  const acceptQuote = useCallback(async (quoteId: string, _createConv?: any) => {
    const result = await acceptQuoteMutation.mutateAsync({ id: quoteId });
    if (result.success && result.quote) {
      console.log('Quote accepted:', quoteId);
      return result.quote;
    }
    throw new Error(result.error || 'Failed to accept quote');
  }, [acceptQuoteMutation]);

  // Route functions
  const createRoute = useCallback(async (routeData: Omit<TravelRoute, 'id' | 'createdAt'>) => {
    const result = await createRouteMutation.mutateAsync(routeData);
    if (result.success && result.route) {
      console.log('Created route:', result.route.id);
      return result.route;
    }
    throw new Error('Failed to create route');
  }, [createRouteMutation]);

  // Chat functions
  const createConversation = useCallback(async (
    type: 'sender_traveler' | 'user_admin',
    shipmentId?: string
  ): Promise<string> => {
    const result = await createConversationMutation.mutateAsync({
      type,
      participants: [],
      shipmentId,
    });
    if (result.success && result.conversation) {
      return result.conversation.id;
    }
    throw new Error('Failed to create conversation');
  }, [createConversationMutation]);

  const sendMessage = useCallback(async (
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'sender' | 'traveler' | 'receiver' | 'admin',
    text: string,
    imageUrl?: string
  ) => {
    const result = await sendMessageMutation.mutateAsync({
      conversationId,
      senderId,
      senderName,
      senderRole,
      text,
      imageUrl,
    });
    if (result.success && result.message) {
      return result.message;
    }
    throw new Error('Failed to send message');
  }, [sendMessageMutation]);

  const getConversationMessages = useCallback((conversationId: string): ChatMessage[] => {
    return [];
  }, []);

  // Ticket functions
  const createTicket = useCallback(async (ticketData: Omit<EscalatedTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    const result = await createTicketMutation.mutateAsync(ticketData);
    if (result.success && result.ticket) {
      return result.ticket;
    }
    throw new Error('Failed to create ticket');
  }, [createTicketMutation]);

  const updateTicket = useCallback(async (ticketId: string, updates: Partial<EscalatedTicket>) => {
    await updateTicketMutation.mutateAsync({ id: ticketId, ...updates });
  }, [updateTicketMutation]);

  // Notification functions
  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const result = await createNotificationMutation.mutateAsync(notificationData);
    if (result.success && result.notification) {
      return result.notification;
    }
    throw new Error('Failed to create notification');
  }, [createNotificationMutation]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    await markNotificationReadMutation.mutateAsync({ id: notificationId });
  }, [markNotificationReadMutation]);

  // Payment functions
  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const result = await createPaymentMutation.mutateAsync(paymentData);
    if (result.success && result.payment) {
      return result.payment;
    }
    if (result.error === 'Payment already completed for this shipment') {
      throw new Error(result.error);
    }
    throw new Error(result.error || 'Failed to create payment');
  }, [createPaymentMutation]);

  const completePayment = useCallback(async (paymentId: string) => {
    const result = await completePaymentMutation.mutateAsync({ id: paymentId });
    if (result.success) {
      console.log('Payment completed:', paymentId);
      return result.payment;
    }
    throw new Error(result.error || 'Failed to complete payment');
  }, [completePaymentMutation]);

  // KYC functions
  const submitKYCRequest = useCallback(async (kycData: {
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
  }) => {
    const result = await submitKYCMutation.mutateAsync(kycData);
    if (result.success && result.kyc) {
      console.log('KYC submitted:', result.kyc.id);
      return result.kyc;
    }
    throw new Error(result.error || 'Failed to submit KYC');
  }, [submitKYCMutation]);

  const cancelKYCRequest = useCallback(async (userId: string) => {
    await cancelKYCMutation.mutateAsync({ userId });
    console.log('KYC cancelled for user:', userId);
  }, [cancelKYCMutation]);

  const approveKYCRequest = useCallback(async (kycId: string) => {
    const result = await approveKYCMutation.mutateAsync({ id: kycId });
    if (result.success) {
      console.log('KYC approved:', kycId);
    }
  }, [approveKYCMutation]);

  const rejectKYCRequest = useCallback(async (kycId: string, reason?: string) => {
    const result = await rejectKYCMutation.mutateAsync({ id: kycId, reason });
    if (result.success) {
      console.log('KYC rejected:', kycId);
    }
  }, [rejectKYCMutation]);

  const getKYCRequestByUserId = useCallback((userId: string) => {
    return kycRequests.find(k => k.userId === userId);
  }, [kycRequests]);

  const getPendingKYCRequests = useCallback(() => {
    return kycRequests.filter(k => k.status === 'pending');
  }, [kycRequests]);

  // Helper functions
  const getShipmentsByUser = useCallback((userId: string, role: 'sender' | 'traveler') => {
    if (role === 'sender') {
      return shipments.filter(s => s.senderId === userId);
    }
    return shipments.filter(s => s.assignedTravelerId === userId);
  }, [shipments]);

  const getAvailableShipments = useCallback((fromCity?: string, toCity?: string) => {
    return shipments.filter(s => {
      if (s.status !== 'created' && s.status !== 'quoted') return false;
      if (fromCity && s.pickupCity !== fromCity) return false;
      if (toCity && s.destinationCity !== toCity) return false;
      return true;
    });
  }, [shipments]);

  const getQuotesForShipment = useCallback((shipmentId: string) => {
    return quotes.filter(q => q.shipmentId === shipmentId);
  }, [quotes]);

  const getUserNotifications = useCallback((userId: string) => {
    return [];
  }, []);

  const getOpenTickets = useCallback(() => {
    return [];
  }, []);

  const getShipmentById = useCallback((shipmentId: string) => {
    return shipments.find(s => s.id === shipmentId);
  }, [shipments]);

  const getPaymentByShipmentId = useCallback((shipmentId: string) => {
    return payments.find(p => p.shipmentId === shipmentId);
  }, [payments]);

  const clearAllData = useCallback(async () => {
    await clearAllDataMutation.mutateAsync();
    console.log('All data cleared');
  }, [clearAllDataMutation]);

  const refreshData = useCallback(async () => {
    console.log('Refreshing data from backend...');
    await Promise.all([
      utils.shipments.getAll.invalidate(),
      utils.quotes.getAll.invalidate(),
      utils.travelRoutes.getAll.invalidate(),
      utils.payments.getAll.invalidate(),
      utils.kyc.getAll.invalidate(),
      utils.chat.getAllConversations.invalidate(),
    ]);
  }, [utils]);

  return {
    shipments,
    quotes,
    routes,
    conversations,
    messages: [] as ChatMessage[],
    notifications: [] as Notification[],
    tickets: [] as EscalatedTicket[],
    payments,
    kycRequests,
    isLoading,
    createShipment,
    updateShipment,
    updateShipmentLocation,
    verifyPickupOTP,
    verifyDeliveryOTP,
    markOutForDelivery,
    acceptJob,
    declineJob,
    autoCancelAcceptance,
    cancelShipment,
    createQuote,
    acceptQuote,
    createRoute,
    createConversation,
    sendMessage,
    getConversationMessages,
    createTicket,
    updateTicket,
    addNotification,
    markNotificationRead,
    createPayment,
    completePayment,
    getShipmentsByUser,
    getAvailableShipments,
    getQuotesForShipment,
    getUserNotifications,
    getOpenTickets,
    getShipmentById,
    getPaymentByShipmentId,
    clearAllData,
    submitKYCRequest,
    cancelKYCRequest,
    approveKYCRequest,
    rejectKYCRequest,
    getKYCRequestByUserId,
    getPendingKYCRequests,
    refreshData,
  };
});
