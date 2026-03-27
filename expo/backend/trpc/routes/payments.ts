import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const paymentsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      shipmentId: z.string(),
      senderId: z.string(),
      travelerId: z.string(),
      amount: z.number(),
      platformFee: z.number(),
      travelerAmount: z.number(),
      method: z.enum(['upi', 'credit_card', 'debit_card', 'cod']),
    }))
    .mutation(async ({ input }) => {
      const existingPayment = db.getPaymentByShipmentId(input.shipmentId);
      if (existingPayment && existingPayment.status === 'completed') {
        return { success: false, error: 'Payment already completed for this shipment' };
      }

      if (existingPayment) {
        return { success: false, error: 'Payment already initiated for this shipment', payment: existingPayment };
      }

      const payment = db.createPayment({
        ...input,
        status: 'pending',
        escrowHeld: false,
      });

      return { success: true, payment };
    }),

  complete: publicProcedure
    .input(z.object({
      id: z.string(),
      transactionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const payment = db.getPaymentById(input.id);
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status === 'completed') {
        return { success: false, error: 'Payment already completed' };
      }

      const updatedPayment = db.updatePayment(input.id, {
        status: 'completed',
        escrowHeld: true,
        completedAt: new Date().toISOString(),
      });

      const shipment = db.getShipmentById(payment.shipmentId);
      if (shipment) {
        db.updateShipment(payment.shipmentId, {
          status: 'confirmed',
          paymentStatus: 'held',
          paymentCompleted: true,
        });

        db.createNotification({
          userId: payment.senderId,
          title: 'Payment Successful',
          message: `Your payment of ₹${payment.amount} for shipment ${shipment.parcelRequestId} is complete. Funds are held in escrow.`,
          type: 'payment',
          data: { shipmentId: payment.shipmentId, paymentId: payment.id },
        });

        db.createNotification({
          userId: payment.travelerId,
          title: 'Shipment Confirmed',
          message: `Payment received for shipment ${shipment.parcelRequestId}. You can now pick up the parcel.`,
          type: 'payment',
          data: { shipmentId: payment.shipmentId, paymentId: payment.id },
        });
      }

      return { success: true, payment: updatedPayment };
    }),

  release: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const payment = db.getPaymentById(input.id);
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      const updatedPayment = db.updatePayment(input.id, {
        escrowHeld: false,
        releasedAt: new Date().toISOString(),
      });

      const traveler = db.getUserById(payment.travelerId);
      if (traveler) {
        db.updateUser(payment.travelerId, {
          earnings: (traveler.earnings || 0) + payment.travelerAmount,
        });
      }

      const shipment = db.getShipmentById(payment.shipmentId);
      if (shipment) {
        db.updateShipment(payment.shipmentId, {
          paymentStatus: 'released',
        });

        db.createNotification({
          userId: payment.travelerId,
          title: 'Payment Released',
          message: `₹${payment.travelerAmount} has been released to your account for shipment ${shipment.parcelRequestId}.`,
          type: 'payment',
          data: { shipmentId: payment.shipmentId, paymentId: payment.id },
        });
      }

      return { success: true, payment: updatedPayment };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getPaymentById(input.id) || null;
    }),

  getByShipmentId: publicProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(async ({ input }) => {
      return db.getPaymentByShipmentId(input.shipmentId) || null;
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllPayments();
    }),
});
