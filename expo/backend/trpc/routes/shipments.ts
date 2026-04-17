import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';
import { TRUST_LIMITS, ACTIVE_SHIPMENT_STATUSES, getCancellationStage } from '@/constants/trustLimits';

const parcelDetailsSchema = z.object({
  description: z.string(),
  weight: z.number(),
  dimensions: z.string(),
  category: z.string(),
  estimatedValue: z.number(),
  fragile: z.boolean(),
  images: z.array(z.string()).optional(),
});

const geoCoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const shipmentsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      senderId: z.string(),
      senderName: z.string(),
      senderPhone: z.string().optional(),
      receiverName: z.string().optional(),
      receiverPhone: z.string().optional(),
      pickupCity: z.string(),
      destinationCity: z.string(),
      pickupAddress: z.string(),
      destinationAddress: z.string(),
      pickupCoords: geoCoordinatesSchema.optional(),
      destinationCoords: geoCoordinatesSchema.optional(),
      parcelDetails: parcelDetailsSchema,
      preferredDate: z.string(),
      paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet', 'paylater', 'emi', 'cod']).optional(),
      specialInstructions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Sender trust limits
      const parcelValue = input.parcelDetails.estimatedValue || 0;
      if (parcelValue > TRUST_LIMITS.MAX_PARCEL_VALUE_INR) {
        return {
          success: false as const,
          error: `Parcel value exceeds the pilot limit of \u20B9${TRUST_LIMITS.MAX_PARCEL_VALUE_INR.toLocaleString('en-IN')}. For higher-value items please contact support.`,
        };
      }

      const senderShipments = db.getShipmentsBySenderId(input.senderId);
      const activeCount = senderShipments.filter(s =>
        (ACTIVE_SHIPMENT_STATUSES as readonly string[]).includes(s.status)
      ).length;
      if (activeCount >= TRUST_LIMITS.MAX_ACTIVE_REQUESTS_PER_SENDER) {
        return {
          success: false as const,
          error: `You already have ${activeCount} active shipments. Please complete or cancel one before creating a new request (limit: ${TRUST_LIMITS.MAX_ACTIVE_REQUESTS_PER_SENDER}).`,
        };
      }

      const shipment = db.createShipment({
        ...input,
        status: 'created',
      });

      db.createNotification({
        userId: input.senderId,
        title: 'Shipment Created',
        message: `Your shipment ${shipment.parcelRequestId} has been created successfully.`,
        type: 'shipment',
        data: { shipmentId: shipment.id },
      });

      return { success: true as const, shipment };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentById(input.id) || null;
    }),

  getByParcelRequestId: publicProcedure
    .input(z.object({ parcelRequestId: z.string() }))
    .query(async ({ input }) => {
      const shipments = db.getAllShipments();
      return shipments.find(s => s.parcelRequestId === input.parcelRequestId) || null;
    }),

  getBySenderId: publicProcedure
    .input(z.object({ senderId: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentsBySenderId(input.senderId);
    }),

  getByTravelerId: publicProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentsByTravelerId(input.travelerId);
    }),

  getAvailable: publicProcedure
    .input(z.object({
      fromCity: z.string().optional(),
      toCity: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAvailableShipments(input?.fromCity, input?.toCity);
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllShipments();
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['created', 'quoted', 'pending_acceptance', 'assigned', 'payment_pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'cancelled']).optional(),
      assignedTravelerId: z.string().optional(),
      assignedTravelerName: z.string().optional(),
      assignedTravelerPhone: z.string().optional(),
      acceptedQuoteAmount: z.number().optional(),
      pickupOtpVerified: z.boolean().optional(),
      deliveryOtpVerified: z.boolean().optional(),
      pickupImages: z.array(z.string()).optional(),
      deliveryImages: z.array(z.string()).optional(),
      paymentStatus: z.enum(['initiated', 'held', 'released', 'failed', 'cod_pending']).optional(),
      paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet', 'paylater', 'emi', 'cod']).optional(),
      paymentCompleted: z.boolean().optional(),
      chatId: z.string().optional(),
      currentLocation: geoCoordinatesSchema.optional(),
      travelerTravelMode: z.enum(['car', 'train', 'bus', 'lorry', 'bike', 'flight', 'others']).optional(),
      travelerDeliveryDate: z.string().optional(),
      travelerParcelImage: z.string().optional(),
      pickupDetailsCompleted: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const shipment = db.updateShipment(id, updates);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }
      return { success: true, shipment };
    }),

  updateLocation: publicProcedure
    .input(z.object({
      id: z.string(),
      coords: geoCoordinatesSchema,
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      const trackingPoint = {
        id: `track_${Date.now()}`,
        coords: input.coords,
        timestamp: new Date().toISOString(),
        status: shipment.status,
      };

      const trackingHistory = [...(shipment.trackingHistory || []), trackingPoint];
      const updated = db.updateShipment(input.id, {
        currentLocation: input.coords,
        trackingHistory,
      });

      return { success: true, shipment: updated };
    }),

  verifyPickupOTP: publicProcedure
    .input(z.object({
      id: z.string(),
      otp: z.string(),
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      if (shipment.pickupOtp !== input.otp) {
        return { success: false, error: 'Invalid OTP' };
      }

      const updated = db.updateShipment(input.id, {
        pickupOtpVerified: true,
        status: 'picked_up',
      });

      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Parcel Picked Up',
          message: `Your parcel ${shipment.parcelRequestId} has been picked up by the traveler.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }

      return { success: true, shipment: updated };
    }),

  verifyDeliveryOTP: publicProcedure
    .input(z.object({
      id: z.string(),
      otp: z.string(),
      deliveryImages: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      if (shipment.deliveryOtp !== input.otp) {
        return { success: false, error: 'Invalid OTP' };
      }

      const updated = db.updateShipment(input.id, {
        deliveryOtpVerified: true,
        status: 'delivered',
        deliveryImages: input.deliveryImages || [],
        deliveryConfirmedAt: new Date().toISOString(),
      });

      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Parcel Delivered',
          message: `Your parcel ${shipment.parcelRequestId} has been delivered successfully to ${shipment.receiverName}.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }

      if (shipment.assignedTravelerId) {
        const payment = db.getPaymentByShipmentId(shipment.id);
        if (payment) {
          db.updatePayment(payment.id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            releasedAt: new Date().toISOString(),
            escrowHeld: false,
          });

          const traveler = db.getUserById(shipment.assignedTravelerId);
          if (traveler) {
            db.updateUser(shipment.assignedTravelerId, {
              earnings: (traveler.earnings || 0) + payment.travelerAmount,
              totalDeliveries: (traveler.totalDeliveries || 0) + 1,
            });
          }
        }

        db.createNotification({
          userId: shipment.assignedTravelerId,
          title: 'Delivery Completed',
          message: `Payment for ${shipment.parcelRequestId} has been released to your account.`,
          type: 'payment',
          data: { shipmentId: shipment.id },
        });
      }

      return { success: true, shipment: updated };
    }),

  markInTransit: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.updateShipment(input.id, { status: 'in_transit' });
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Parcel In Transit',
          message: `Your parcel ${shipment.parcelRequestId} is now in transit.`,
          type: 'tracking',
          data: { shipmentId: shipment.id },
        });
      }

      return { success: true, shipment };
    }),

  markOutForDelivery: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      const newDeliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
      
      const updated = db.updateShipment(input.id, { 
        status: 'out_for_delivery',
        deliveryOtp: newDeliveryOtp,
        deliveryOtpVerified: false,
      });

      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Out for Delivery',
          message: `Your parcel ${shipment.parcelRequestId} is out for delivery! Delivery OTP: ${newDeliveryOtp}`,
          type: 'tracking',
          data: { shipmentId: shipment.id, deliveryOtp: newDeliveryOtp },
        });
      }

      if (shipment.receiverPhone) {
        console.log(`[SMS] Sending delivery OTP ${newDeliveryOtp} to receiver ${shipment.receiverPhone}`);
      }

      return { success: true, shipment: updated, deliveryOtp: newDeliveryOtp };
    }),

  markCompleted: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.updateShipment(input.id, { status: 'completed' });
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      const sender = db.getUserById(shipment.senderId);
      if (sender) {
        db.updateUser(shipment.senderId, {
          totalShipments: (sender.totalShipments || 0) + 1,
        });
      }

      return { success: true, shipment };
    }),

  acceptJob: publicProcedure
    .input(z.object({ id: z.string(), travelerId: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.assignedTravelerId !== input.travelerId) {
        return { success: false as const, error: 'Only the assigned traveler can accept this job' };
      }
      if (shipment.status !== 'pending_acceptance') {
        return { success: false as const, error: 'This job is not awaiting acceptance' };
      }
      if (shipment.jobAcceptDeadline && new Date(shipment.jobAcceptDeadline).getTime() < Date.now()) {
        return { success: false as const, error: 'Acceptance window has expired' };
      }

      const updated = db.updateShipment(input.id, {
        status: 'assigned',
        jobAcceptedAt: new Date().toISOString(),
      });

      db.createNotification({
        userId: shipment.senderId,
        title: 'Traveler Accepted Job',
        message: `${shipment.assignedTravelerName} has accepted your shipment ${shipment.parcelRequestId}. Please proceed to payment.`,
        type: 'shipment',
        data: { shipmentId: shipment.id },
      });

      return { success: true as const, shipment: updated };
    }),

  declineJob: publicProcedure
    .input(z.object({ id: z.string(), travelerId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.assignedTravelerId !== input.travelerId) {
        return { success: false as const, error: 'Only the assigned traveler can decline this job' };
      }
      if (shipment.status !== 'pending_acceptance' && shipment.status !== 'assigned') {
        return { success: false as const, error: 'Job cannot be declined at this stage' };
      }

      // Mark accepted quote as declined and reopen shipment for new quotes
      const allQuotes = db.getQuotesForShipment(input.id);
      allQuotes.forEach(q => {
        if (q.travelerId === input.travelerId && q.status === 'accepted') {
          db.updateQuote(q.id, { status: 'declined' });
        }
      });

      const updated = db.updateShipment(input.id, {
        status: 'quoted',
        assignedTravelerId: undefined,
        assignedTravelerName: undefined,
        assignedTravelerPhone: undefined,
        acceptedQuoteAmount: undefined,
        chatId: undefined,
        jobAcceptDeadline: undefined,
      });

      db.createNotification({
        userId: shipment.senderId,
        title: 'Traveler Declined',
        message: `${shipment.assignedTravelerName} declined your shipment ${shipment.parcelRequestId}. You can accept another quote.`,
        type: 'shipment',
        data: { shipmentId: shipment.id },
      });

      return { success: true as const, shipment: updated };
    }),

  autoCancelExpiredAcceptance: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.status !== 'pending_acceptance') {
        return { success: false as const, error: 'Not awaiting acceptance' };
      }
      if (!shipment.jobAcceptDeadline || new Date(shipment.jobAcceptDeadline).getTime() > Date.now()) {
        return { success: false as const, error: 'Deadline not reached' };
      }

      const allQuotes = db.getQuotesForShipment(input.id);
      allQuotes.forEach(q => {
        if (q.travelerId === shipment.assignedTravelerId && q.status === 'accepted') {
          db.updateQuote(q.id, { status: 'expired' });
        }
      });

      const updated = db.updateShipment(input.id, {
        status: 'quoted',
        assignedTravelerId: undefined,
        assignedTravelerName: undefined,
        assignedTravelerPhone: undefined,
        acceptedQuoteAmount: undefined,
        chatId: undefined,
        jobAcceptDeadline: undefined,
      });

      if (shipment.assignedTravelerId) {
        db.createNotification({
          userId: shipment.assignedTravelerId,
          title: 'Job Timed Out',
          message: `You did not accept shipment ${shipment.parcelRequestId} in time. It has been reopened.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }
      db.createNotification({
        userId: shipment.senderId,
        title: 'Traveler Did Not Respond',
        message: `Your shipment ${shipment.parcelRequestId} is open again \u2014 the traveler did not accept in time.`,
        type: 'shipment',
        data: { shipmentId: shipment.id },
      });

      return { success: true as const, shipment: updated };
    }),

  cancel: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      reason: z.enum(['user_cancelled', 'traveler_declined', 'traveler_timeout', 'admin_cancelled', 'other']).default('user_cancelled'),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };

      const stage = getCancellationStage(shipment.status);
      if (stage === 'not_allowed') {
        return { success: false as const, error: 'This shipment cannot be cancelled' };
      }
      if (stage === 'dispute_only') {
        return {
          success: false as const,
          error: 'Cancellation not allowed after pickup. Please raise a dispute via support instead.',
        };
      }

      const isSender = shipment.senderId === input.userId;
      const isTraveler = shipment.assignedTravelerId === input.userId;
      if (!isSender && !isTraveler) {
        return { success: false as const, error: 'Not authorised to cancel this shipment' };
      }

      // Mark pending quotes as expired
      const allQuotes = db.getQuotesForShipment(input.id);
      allQuotes.forEach(q => {
        if (q.status === 'pending' || q.status === 'accepted') {
          db.updateQuote(q.id, { status: 'expired' });
        }
      });

      const updated = db.updateShipment(input.id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: input.userId,
        cancellationReason: input.reason,
        cancellationNote: input.note,
      });

      const targetUserId = isSender ? shipment.assignedTravelerId : shipment.senderId;
      if (targetUserId) {
        db.createNotification({
          userId: targetUserId,
          title: 'Shipment Cancelled',
          message: `Shipment ${shipment.parcelRequestId} has been cancelled${stage === 'restricted' ? ' (after assignment)' : ''}.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }

      return { success: true as const, shipment: updated, stage };
    }),
});
