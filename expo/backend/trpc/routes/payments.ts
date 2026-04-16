import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
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
  createOrder: publicProcedure
    .input(z.object({
      shipmentId: z.string(),
      senderId: z.string(),
      travelerId: z.string(),
      amount: z.number(),
      platformFee: z.number(),
      travelerAmount: z.number(),
      method: paymentMethodEnum,
    }))
    .mutation(async ({ input }) => {
      const existingPayment = db.getPaymentByShipmentId(input.shipmentId);
      if (existingPayment && existingPayment.status === 'completed') {
        return { success: false, error: 'Payment already completed for this shipment' as const };
      }

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return { success: false, error: 'Razorpay is not configured on the server' as const };
      }

      try {
        const order = await createRazorpayOrder(
          Math.round(input.amount * 100),
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
              amount: input.amount,
              platformFee: input.platformFee,
              travelerAmount: input.travelerAmount,
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

  verifyPayment: publicProcedure
    .input(z.object({
      paymentId: z.string(),
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }))
    .mutation(async ({ input }) => {
      const payment = db.getPaymentById(input.paymentId);
      if (!payment) return { success: false, error: 'Payment not found' };

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
        escrowHeld: false,
        completedAt: new Date().toISOString(),
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
      });

      const shipment = db.getShipmentById(payment.shipmentId);
      if (shipment) {
        db.updateShipment(payment.shipmentId, {
          status: 'confirmed',
          paymentMethod: payment.method,
          paymentStatus: 'released',
          paymentCompleted: true,
        });

        const traveler = db.getUserById(payment.travelerId);
        if (traveler) {
          db.updateUser(payment.travelerId, {
            earnings: (traveler.earnings || 0) + payment.travelerAmount,
          });
        }

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

  create: publicProcedure
    .input(z.object({
      shipmentId: z.string(),
      senderId: z.string(),
      travelerId: z.string(),
      amount: z.number(),
      platformFee: z.number(),
      travelerAmount: z.number(),
      method: paymentMethodEnum,
      status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
      escrowHeld: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = db.getPaymentByShipmentId(input.shipmentId);
      if (existing && existing.status === 'completed') {
        return { success: false, error: 'Payment already completed for this shipment' };
      }
      if (existing) {
        return { success: false, error: 'Payment already initiated for this shipment', payment: existing };
      }
      const payment = db.createPayment({
        shipmentId: input.shipmentId,
        senderId: input.senderId,
        travelerId: input.travelerId,
        amount: input.amount,
        platformFee: input.platformFee,
        travelerAmount: input.travelerAmount,
        method: input.method,
        status: input.status ?? 'pending',
        escrowHeld: input.escrowHeld ?? false,
      });
      return { success: true, payment };
    }),

  complete: publicProcedure
    .input(z.object({ id: z.string(), transactionId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const payment = db.getPaymentById(input.id);
      if (!payment) return { success: false, error: 'Payment not found' };
      if (payment.status === 'completed') return { success: false, error: 'Payment already completed' };

      const updatedPayment = db.updatePayment(input.id, {
        status: 'completed',
        escrowHeld: false,
        completedAt: new Date().toISOString(),
      });

      const shipment = db.getShipmentById(payment.shipmentId);
      if (shipment) {
        db.updateShipment(payment.shipmentId, {
          status: 'confirmed',
          paymentStatus: 'released',
          paymentCompleted: true,
        });
      }
      return { success: true, payment: updatedPayment };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => db.getPaymentById(input.id) || null),

  getByShipmentId: publicProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(async ({ input }) => db.getPaymentByShipmentId(input.shipmentId) || null),

  getAll: publicProcedure.query(async () => db.getAllPayments()),
});
