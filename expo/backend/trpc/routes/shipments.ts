import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { db } from '../../db/store';
import { TRUST_LIMITS, ACTIVE_SHIPMENT_STATUSES, getCancellationStage, canRaiseDispute } from '@/constants/trustLimits';
import { canTransition } from '../../db/stateMachine';
import { auditLog, AuditActor } from '../../db/auditLog';
import { PILOT_CONFIG, isPilotCity, isIntraCityAllowed } from '@/constants/pilotConfig';
import type { Shipment, ShipmentStatus } from '@/types';

function safeTransition(
  shipment: Shipment,
  nextStatus: ShipmentStatus,
  actor: { id?: string; role: AuditActor; action: string; metadata?: Record<string, unknown> },
): { ok: true } | { ok: false; error: string } {
  if (!canTransition(shipment.status, nextStatus)) {
    console.log('[StateMachine] blocked transition', shipment.id, shipment.status, '->', nextStatus);
    return { ok: false, error: `Cannot move shipment from ${shipment.status} to ${nextStatus}` };
  }
  auditLog.record({
    entityType: 'shipment',
    entityId: shipment.id,
    action: actor.action,
    actorId: actor.id,
    actorRole: actor.role,
    fromState: shipment.status,
    toState: nextStatus,
    metadata: actor.metadata,
  });
  return { ok: true };
}

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
  create: protectedProcedure
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
      pickupWindowStart: z.string().optional(),
      pickupWindowEnd: z.string().optional(),
      deliveryWindowStart: z.string().optional(),
      deliveryWindowEnd: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.senderId !== ctx.user.id) return { success: false as const, error: 'Sender does not match authenticated user' };
      // Pilot geo-fence: intra-city only, only in allowed cities
      if (PILOT_CONFIG.INTRA_CITY_ONLY && !isIntraCityAllowed(input.pickupCity, input.destinationCity)) {
        return {
          success: false as const,
          error: `During the pilot we only support intra-city shipments. Pickup and destination city must match.`,
        };
      }
      if (!isPilotCity(input.pickupCity) || !isPilotCity(input.destinationCity)) {
        return {
          success: false as const,
          error: `The pilot is currently limited to: ${PILOT_CONFIG.ALLOWED_CITIES.join(', ')}.`,
        };
      }

      // Sender trust limits (use the stricter of pilot cap vs. trust cap)
      const parcelValue = input.parcelDetails.estimatedValue || 0;
      const cap = Math.min(PILOT_CONFIG.MAX_PARCEL_VALUE_INR, TRUST_LIMITS.MAX_PARCEL_VALUE_INR);
      if (parcelValue > cap) {
        return {
          success: false as const,
          error: `Parcel value exceeds the pilot limit of \u20B9${cap.toLocaleString('en-IN')}. For higher-value items please contact support.`,
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

      auditLog.record({
        entityType: 'shipment',
        entityId: shipment.id,
        action: 'create',
        actorId: input.senderId,
        actorRole: 'sender',
        toState: 'created',
        metadata: { parcelValue, pickupCity: input.pickupCity },
      });

      // Update sender risk flags silently
      db.computeRiskFlags(input.senderId);

      db.createNotification({
        userId: input.senderId,
        title: 'Shipment Created',
        message: `Your shipment ${shipment.parcelRequestId} has been created successfully.`,
        type: 'shipment',
        data: { shipmentId: shipment.id },
      });

      return { success: true as const, shipment };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentById(input.id) || null;
    }),

  getByParcelRequestId: protectedProcedure
    .input(z.object({ parcelRequestId: z.string() }))
    .query(async ({ input }) => {
      const shipments = db.getAllShipments();
      return shipments.find(s => s.parcelRequestId === input.parcelRequestId) || null;
    }),

  getBySenderId: protectedProcedure
    .input(z.object({ senderId: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentsBySenderId(input.senderId);
    }),

  getByTravelerId: protectedProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getShipmentsByTravelerId(input.travelerId);
    }),

  getAvailable: protectedProcedure
    .input(z.object({
      fromCity: z.string().optional(),
      toCity: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAvailableShipments(input?.fromCity, input?.toCity);
    }),

  getAll: protectedProcedure
    .query(async () => {
      return db.getAllShipments();
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['created', 'quoted', 'pending_acceptance', 'assigned', 'payment_pending', 'confirmed', 'pickup_delayed', 'no_show', 'picked_up', 'in_transit', 'out_for_delivery', 'delivery_attempted', 'delivered', 'returning', 'returned', 'completed', 'cancelled']).optional(),
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
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      const current = db.getShipmentById(id);
      if (!current || current.assignedTravelerId !== ctx.user.id) {
        return { success: false, error: 'Only the assigned traveler can update pickup details' };
      }
      const forbidden = ['assignedTravelerId', 'assignedTravelerName', 'assignedTravelerPhone',
        'acceptedQuoteAmount', 'pickupOtpVerified', 'deliveryOtpVerified', 'paymentStatus',
        'paymentMethod', 'paymentCompleted', 'chatId'];
      if (forbidden.some(field => field in updates) ||
          (updates.status && (updates.status !== 'assigned' && updates.status !== 'in_transit')) ||
          (updates.status === 'in_transit' && !canTransition(current.status, 'in_transit')) ||
          (updates.status === 'assigned' && current.status !== 'assigned')) {
        return { success: false, error: 'Use the verified workflow for this change' };
      }
      const shipment = db.updateShipment(id, updates);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }
      return { success: true, shipment };
    }),

  updateLocation: protectedProcedure
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

  verifyPickupOTP: protectedProcedure
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
        auditLog.record({
          entityType: 'shipment',
          entityId: shipment.id,
          action: 'pickup_otp_failed',
          actorRole: 'traveler',
        });
        return { success: false, error: 'Invalid OTP' };
      }

      const t = safeTransition(shipment, 'picked_up', {
        id: shipment.assignedTravelerId,
        role: 'traveler',
        action: 'verify_pickup_otp',
      });
      if (!t.ok) return { success: false, error: t.error };

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

  verifyDeliveryOTP: protectedProcedure
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
        auditLog.record({
          entityType: 'shipment',
          entityId: shipment.id,
          action: 'delivery_otp_failed',
          actorRole: 'traveler',
        });
        return { success: false, error: 'Invalid OTP' };
      }

      const t = safeTransition(shipment, 'delivered', {
        id: shipment.assignedTravelerId,
        role: 'traveler',
        action: 'verify_delivery_otp',
      });
      if (!t.ok) return { success: false, error: t.error };

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
        db.createNotification({
          userId: shipment.assignedTravelerId,
          title: 'Delivery Completed',
          message: `Delivery of ${shipment.parcelRequestId} has been recorded. Payout is subject to payment reconciliation.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }

      return { success: true, shipment: updated };
    }),

  markInTransit: protectedProcedure
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

  markOutForDelivery: protectedProcedure
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

  markCompleted: protectedProcedure
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

  acceptJob: protectedProcedure
    .input(z.object({ id: z.string(), travelerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (ctx.user.id !== input.travelerId || shipment.assignedTravelerId !== input.travelerId) {
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

  declineJob: protectedProcedure
    .input(z.object({ id: z.string(), travelerId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (ctx.user.id !== input.travelerId || shipment.assignedTravelerId !== input.travelerId) {
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

  autoCancelExpiredAcceptance: protectedProcedure
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

  cancel: protectedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      reason: z.enum(['user_cancelled', 'traveler_declined', 'traveler_timeout', 'admin_cancelled', 'no_show', 'other']).default('user_cancelled'),
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

      // refresh sender risk flags
      if (shipment.senderId) db.computeRiskFlags(shipment.senderId);

      return { success: true as const, shipment: updated, stage };
    }),

  markNoShow: protectedProcedure
    .input(z.object({ id: z.string(), userId: z.string(), note: z.string().optional() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.senderId !== input.userId) {
        return { success: false as const, error: 'Only the sender can mark a no-show' };
      }
      const allowed: string[] = ['assigned', 'confirmed', 'pickup_delayed'];
      if (!allowed.includes(shipment.status)) {
        return { success: false as const, error: 'No-show can only be marked before pickup' };
      }
      const updated = db.updateShipment(input.id, {
        status: 'no_show',
        noShowAt: new Date().toISOString(),
        noShowMarkedBy: input.userId,
      });
      if (shipment.assignedTravelerId) {
        db.createNotification({
          userId: shipment.assignedTravelerId,
          title: 'Marked as No-Show',
          message: `Sender marked you as no-show for ${shipment.parcelRequestId}.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }
      return { success: true as const, shipment: updated };
    }),

  requestReassignment: protectedProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.senderId !== input.userId) {
        return { success: false as const, error: 'Only the sender can request reassignment' };
      }
      const allowed: string[] = ['no_show', 'pickup_delayed'];
      if (!allowed.includes(shipment.status)) {
        return { success: false as const, error: 'Reassignment not available at this stage' };
      }

      const allQuotes = db.getQuotesForShipment(input.id);
      allQuotes.forEach(q => {
        if (q.travelerId === shipment.assignedTravelerId && (q.status === 'accepted' || q.status === 'pending')) {
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
        reassignmentRequested: true,
      });

      return { success: true as const, shipment: updated };
    }),

  checkPickupDelay: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (!shipment.pickupWindowEnd) return { success: false as const, error: 'No pickup window set' };
      const allowed: string[] = ['assigned', 'confirmed'];
      if (!allowed.includes(shipment.status)) {
        return { success: false as const, error: 'Not in pickup stage' };
      }
      const deadline = new Date(shipment.pickupWindowEnd).getTime() + TRUST_LIMITS.PICKUP_GRACE_MS;
      if (Date.now() < deadline) return { success: false as const, error: 'Within grace period' };
      const updated = db.updateShipment(input.id, { status: 'pickup_delayed' });
      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Pickup Delayed',
          message: `Traveler has not picked up ${shipment.parcelRequestId} in time. You can mark no-show or request reassignment.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }
      return { success: true as const, shipment: updated };
    }),

  markDeliveryAttempted: protectedProcedure
    .input(z.object({ id: z.string(), travelerId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.assignedTravelerId !== input.travelerId) {
        return { success: false as const, error: 'Only the assigned traveler can mark attempt' };
      }
      const allowed: string[] = ['out_for_delivery', 'in_transit'];
      if (!allowed.includes(shipment.status)) {
        return { success: false as const, error: 'Shipment not out for delivery' };
      }
      const updated = db.updateShipment(input.id, {
        status: 'delivery_attempted',
        deliveryAttemptedAt: new Date().toISOString(),
        deliveryAttemptReason: input.reason,
      });
      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Delivery Attempt Failed',
          message: `Traveler attempted delivery of ${shipment.parcelRequestId} but was unsuccessful.${input.reason ? ` Reason: ${input.reason}` : ''}`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }
      return { success: true as const, shipment: updated };
    }),

  rescheduleDelivery: protectedProcedure
    .input(z.object({ id: z.string(), newDate: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.status !== 'delivery_attempted') {
        return { success: false as const, error: 'Not in delivery attempted state' };
      }
      const updated = db.updateShipment(input.id, {
        status: 'in_transit',
        rescheduledDeliveryDate: input.newDate,
      });
      return { success: true as const, shipment: updated };
    }),

  startReturn: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      const allowed: string[] = ['delivery_attempted'];
      if (!allowed.includes(shipment.status)) {
        return { success: false as const, error: 'Return only from delivery attempted state' };
      }
      const updated = db.updateShipment(input.id, {
        status: 'returning',
        returnReason: input.reason,
      });
      if (shipment.senderId) {
        db.createNotification({
          userId: shipment.senderId,
          title: 'Parcel Being Returned',
          message: `Traveler is returning parcel ${shipment.parcelRequestId} to you.`,
          type: 'shipment',
          data: { shipmentId: shipment.id },
        });
      }
      return { success: true as const, shipment: updated };
    }),

  confirmReturned: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (shipment.status !== 'returning') {
        return { success: false as const, error: 'Not in returning state' };
      }
      const updated = db.updateShipment(input.id, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
      });
      return { success: true as const, shipment: updated };
    }),

  raiseDispute: protectedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      type: z.enum(['not_delivered', 'wrong_item', 'damaged', 'payment_issue', 'other']),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      const check = canRaiseDispute(shipment.status, shipment.deliveryConfirmedAt);
      if (!check.allowed) return { success: false as const, error: check.reason };

      const existing = db.getDisputeByShipmentId(input.id);
      if (existing) return { success: false as const, error: 'Dispute already raised', dispute: existing };

      const dispute = db.createDispute({
        shipmentId: input.id,
        raisedBy: input.userId,
        type: input.type,
        description: input.description,
      });
      db.updateShipment(input.id, { disputeId: dispute.id });

      db.createTicket({
        userId: input.userId,
        userName: shipment.senderId === input.userId ? shipment.senderName : (shipment.assignedTravelerName ?? 'User'),
        userRole: shipment.senderId === input.userId ? 'sender' : 'traveler',
        category: 'dispute',
        subcategory: input.type,
        description: input.description,
        status: 'open',
        priority: 'high',
      });

      if (shipment.senderId) db.computeRiskFlags(shipment.senderId);

      return { success: true as const, dispute };
    }),

  rateShipment: protectedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      rating: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      const shipment = db.getShipmentById(input.id);
      if (!shipment) return { success: false as const, error: 'Shipment not found' };
      if (!['delivered', 'completed'].includes(shipment.status)) {
        return { success: false as const, error: 'Can only rate after delivery' };
      }
      const isSender = shipment.senderId === input.userId;
      const updates: Partial<typeof shipment> = isSender
        ? { senderRating: input.rating }
        : { travelerRating: input.rating };
      const updated = db.updateShipment(input.id, updates);

      // Update target user's running rating
      const targetUserId = isSender ? shipment.assignedTravelerId : shipment.senderId;
      if (targetUserId) {
        const target = db.getUserById(targetUserId);
        if (target) {
          const count = (target.totalDeliveries || 0) + (target.totalShipments || 0) || 1;
          const newRating = ((target.rating || 5) * (count - 1) + input.rating) / count;
          db.updateUser(targetUserId, { rating: Math.round(newRating * 10) / 10 });
        }
      }

      return { success: true as const, shipment: updated };
    }),
});
