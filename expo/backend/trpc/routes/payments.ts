import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../create-context';
import { db } from '../../db/store';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const paymentMethodEnum = z.enum(['upi', 'card', 'netbanking', 'wallet', 'paylater', 'emi', 'cod']);

async function createRazorpayOrder(amountInPaise: number, receipt: string, notes: Record<string, string>) {
  const auth = typeof Buffer !== 'undefined'
    ? Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    : btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.log('[Razorpay] Order creation failed:', data);
    throw new Error(data?.error?.description || 'Failed to create Razorpay order');
  }
  return data as { id: string; amount: number; currency: string; status: string };
}

async function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  try {
    const payload = `${orderId}|${paymentId}`;
    let expectedSignature = '';

    try {
      const cryptoMod = await import('crypto');
      expectedSignature = cryptoMod.createHmac('sha256', RAZORPAY_KEY_SECRET).update(payload).digest('hex');
    } catch (e) {
      console.log('[Razorpay] node crypto unavailable, using Web Crypto');
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(RAZORPAY_KEY_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
      expectedSignature = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return expectedSignature === signature;
  } catch (error) {
    console.log('[Razorpay] Signature verification error:', error);
    return false;
  }
}

export const paymentsRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(z.object({
      shipmentId: z.string(),
      senderId: z.string(),
      travelerId: z.string(),
      amount: z.number(),
      platformFee: z.number(),
      travelerAmount: z.number(),
      method: paymentMethodEnum,
    }))
    .mutation(async ({ input, ctx }) => {
      const shipment = db.getShipmentById(input.shipmentId);
      if (!shipment || shipment.senderId !== ctx.user.id || shipment.senderId !== input.senderId ||
          shipment.assignedTravelerId !== input.travelerId || shipment.status !== 'assigned' ||
          !shipment.acceptedQuoteAmount || input.method === 'cod') {
        return { success: false as const, error: 'Invalid shipment or payment method' };
      }
      const amount = shipment.acceptedQuoteAmount;
      const platformFee = Math.round(amount * 0.2);
      const travelerAmount = amount - platformFee;
      const existingPayment = db.getPaymentByShipmentId(input.shipmentId);
      if (existingPayment && existingPayment.status === 'completed') {
        return { success: false, error: 'Payment already completed for this shipment' as const };
      }

      if (!RAZORPAY_KEY_ID.startsWith('rzp_test_') || !RAZORPAY_KEY_SECRET) {
        return { success: false, error: 'Only Razorpay test orders are available until the payment ledger is persistent' as const };
      }

      try {
        const order = await createRazorpayOrder(
          Math.round(amount * 100),
          `sh_${input.shipmentId}`.slice(0, 40),
          { shipmentId: input.shipmentId, senderId: input.senderId, method: input.method },
        );

        const payment = existingPayment
          ? db.updatePayment(existingPayment.id, {
              method: input.method,
              razorpayOrderId: order.id,
              status: 'pending',
            })!
          : db.createPayment({
              shipmentId: input.shipmentId,
              senderId: input.senderId,
              travelerId: input.travelerId,
              amount,
              platformFee,
              travelerAmount,
              method: input.method,
              status: 'pending',
              escrowHeld: false,
              razorpayOrderId: order.id,
            });

        return {
          success: true as const,
          payment,
          order: { id: order.id, amount: order.amount, currency: order.currency },
          keyId: RAZORPAY_KEY_ID,
        };
      } catch (error: any) {
        console.log('[Razorpay] createOrder error:', error?.message);
        return { success: false, error: error?.message || 'Failed to create order' };
      }
    }),

  verifyPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payment = db.getPaymentById(input.paymentId);
      if (!payment || payment.senderId !== ctx.user.id || payment.razorpayOrderId !== input.razorpayOrderId || payment.status !== 'pending') return { success: false, error: 'Invalid payment' };

      const valid = await verifyRazorpaySignature(
        input.razorpayOrderId,
        input.razorpayPaymentId,
        input.razorpaySignature,
      );
      if (!valid) {
        db.updatePayment(payment.id, { status: 'failed' });
        return { success: false, error: 'Invalid payment signature' };
      }

      const updatedPayment = db.updatePayment(payment.id, {
        status: 'completed',
        escrowHeld: true,
        completedAt: new Date().toISOString(),
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
      });

      const shipment = db.getShipmentById(payment.shipmentId);
      if (shipment) {
        db.updateShipment(payment.shipmentId, {
          status: 'confirmed',
          paymentMethod: payment.method,
          paymentStatus: 'held',
          paymentCompleted: true,
        });

        db.createNotification({
          userId: payment.senderId,
          title: 'Payment Successful',
          message: `Your payment of ₹${payment.amount} for ${shipment.parcelRequestId} is complete.`,
          type: 'payment',
          data: { shipmentId: payment.shipmentId, paymentId: payment.id },
        });
        db.createNotification({
          userId: payment.travelerId,
          title: 'Shipment Confirmed',
          message: `Payment received for ${shipment.parcelRequestId}. You can now pick up the parcel.`,
          type: 'payment',
          data: { shipmentId: payment.shipmentId, paymentId: payment.id },
        });
      }

      return { success: true as const, payment: updatedPayment };
    }),

  create: protectedProcedure
    .input(z.object({
      shipmentId: z.string(), senderId: z.string(), travelerId: z.string(),
      amount: z.number(), platformFee: z.number(), travelerAmount: z.number(),
      method: paymentMethodEnum, status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
      escrowHeld: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => {
      const shipment = db.getShipmentById(input.shipmentId);
      if (input.method !== 'cod' || input.status && input.status !== 'pending' ||
          !shipment || shipment.senderId !== ctx.user.id || shipment.senderId !== input.senderId ||
          shipment.assignedTravelerId !== input.travelerId || shipment.status !== 'assigned' ||
          !shipment.acceptedQuoteAmount) {
        return { success: false, error: 'Invalid cash payment request' };
      }
      if (db.getPaymentByShipmentId(input.shipmentId)) {
        return { success: false, error: 'Payment already initiated' };
      }
      const amount = shipment.acceptedQuoteAmount;
      const platformFee = Math.round(amount * 0.2);
      const payment = db.createPayment({
        shipmentId: shipment.id, senderId: shipment.senderId,
        travelerId: shipment.assignedTravelerId, amount, platformFee,
        travelerAmount: amount - platformFee, method: 'cod', status: 'pending', escrowHeld: false,
      });
      db.updateShipment(shipment.id, { status: 'confirmed', paymentMethod: 'cod', paymentStatus: 'cod_pending', paymentCompleted: false });
      return { success: true, payment };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string(), transactionId: z.string().optional() }))
    .mutation(() => ({ success: false as const, error: 'Client payment completion is disabled', payment: null })),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const payment = db.getPaymentById(input.id);
      return payment && (ctx.user.isAdmin || payment.senderId === ctx.user.id || payment.travelerId === ctx.user.id) ? payment : null;
    }),

  getByShipmentId: protectedProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(({ input, ctx }) => {
      const payment = db.getPaymentByShipmentId(input.shipmentId);
      return payment && (ctx.user.isAdmin || payment.senderId === ctx.user.id || payment.travelerId === ctx.user.id) ? payment : null;
    }),

  getAll: adminProcedure.query(async () => db.getAllPayments()),
});
