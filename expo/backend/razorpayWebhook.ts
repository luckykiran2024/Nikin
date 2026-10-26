import { Hono } from 'hono';
import { db } from './db/store';
import { auditLog } from './db/auditLog';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  try {
    const cryptoMod = await import('crypto');
    return cryptoMod.createHmac('sha256', secret).update(payload).digest('hex');
  } catch {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const processedEvents = new Set<string>();

export const webhookRouter = new Hono();

webhookRouter.post('/razorpay', async (c) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.log('[RazorpayWebhook] secret not configured');
    return c.json({ ok: false, error: 'Webhook not configured' }, 500);
  }

  const signature = c.req.header('x-razorpay-signature') || '';
  const rawBody = await c.req.text();

  const expected = await hmacSha256Hex(RAZORPAY_WEBHOOK_SECRET, rawBody);
  if (!timingSafeEqualHex(expected, signature)) {
    console.log('[RazorpayWebhook] invalid signature');
    auditLog.record({
      entityType: 'payment',
      entityId: 'unknown',
      action: 'webhook_invalid_signature',
      actorRole: 'webhook',
    });
    return c.json({ ok: false, error: 'Invalid signature' }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const eventId: string = payload?.id || payload?.event_id || `${payload?.event}_${Date.now()}`;
  if (processedEvents.has(eventId)) {
    console.log('[RazorpayWebhook] duplicate event ignored:', eventId);
    return c.json({ ok: true, duplicate: true });
  }
  processedEvents.add(eventId);

  const event: string = payload?.event ?? '';
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderId: string | undefined = paymentEntity?.order_id;
  const razorpayPaymentId: string | undefined = paymentEntity?.id;

  console.log('[RazorpayWebhook] event:', event, 'orderId:', orderId);

  const payment = orderId
    ? db.getAllPayments().find(p => p.razorpayOrderId === orderId)
    : undefined;

  if (!payment) {
    console.log('[RazorpayWebhook] no matching payment for order', orderId);
    return c.json({ ok: true, matched: false });
  }

  switch (event) {
    case 'payment.captured': {
      if (payment.status !== 'completed') {
        db.updatePayment(payment.id, {
          status: 'completed',
          escrowHeld: true,
          completedAt: new Date().toISOString(),
          razorpayPaymentId,
        });
        const shipment = db.getShipmentById(payment.shipmentId);
        if (shipment && shipment.status !== 'confirmed') {
          db.updateShipment(payment.shipmentId, {
            status: 'confirmed',
            paymentStatus: 'held',
            paymentCompleted: true,
          });
        }
        auditLog.record({
          entityType: 'payment',
          entityId: payment.id,
          action: 'webhook_captured',
          actorRole: 'webhook',
          metadata: { razorpayPaymentId, orderId },
        });
      }
      break;
    }
    case 'payment.failed': {
      db.updatePayment(payment.id, { status: 'failed' });
      auditLog.record({
        entityType: 'payment',
        entityId: payment.id,
        action: 'webhook_failed',
        actorRole: 'webhook',
        metadata: { reason: paymentEntity?.error_description },
      });
      break;
    }
    case 'refund.processed':
    case 'refund.created': {
      db.updatePayment(payment.id, { status: 'refunded' });
      auditLog.record({
        entityType: 'payment',
        entityId: payment.id,
        action: `webhook_${event}`,
        actorRole: 'webhook',
      });
      break;
    }
    default:
      console.log('[RazorpayWebhook] unhandled event:', event);
  }

  return c.json({ ok: true });
});
