export const TRUST_LIMITS = {
  MAX_PARCEL_VALUE_INR: 20000,
  MAX_ACTIVE_REQUESTS_PER_SENDER: 5,
  JOB_ACCEPT_WINDOW_MS: 15 * 60 * 1000,
  PICKUP_GRACE_MS: 15 * 60 * 1000,
  DELIVERY_DISPUTE_WINDOW_MS: 24 * 60 * 60 * 1000,
  FRAUD_MAX_CANCELLATIONS_7D: 3,
  FRAUD_MAX_DISPUTES_30D: 2,
  FRAUD_MAX_HIGH_VALUE_24H: 2,
  HIGH_VALUE_THRESHOLD_INR: 10000,
} as const;

export const ACTIVE_SHIPMENT_STATUSES = [
  'created',
  'quoted',
  'pending_acceptance',
  'assigned',
  'payment_pending',
  'confirmed',
  'pickup_delayed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'returning',
] as const;

export const CANCELLATION_RULES = {
  free: ['created', 'quoted'] as const,
  restricted: ['pending_acceptance', 'assigned', 'payment_pending', 'confirmed', 'pickup_delayed', 'no_show'] as const,
  disputeOnly: ['picked_up', 'in_transit', 'out_for_delivery', 'delivery_attempted', 'delivered', 'returning'] as const,
};

export const DISPUTE_ALLOWED_STATUSES = [
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'delivered',
  'returning',
] as const;

export function canRaiseDispute(status: string, deliveryConfirmedAt?: string): { allowed: boolean; reason?: string } {
  if (!(DISPUTE_ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return { allowed: false, reason: 'Disputes can only be raised after pickup.' };
  }
  if (status === 'delivered' && deliveryConfirmedAt) {
    const elapsed = Date.now() - new Date(deliveryConfirmedAt).getTime();
    if (elapsed > TRUST_LIMITS.DELIVERY_DISPUTE_WINDOW_MS) {
      return { allowed: false, reason: 'Dispute window (24 hours after delivery) has closed.' };
    }
  }
  return { allowed: true };
}

export function getCancellationStage(status: string): 'free' | 'restricted' | 'dispute_only' | 'not_allowed' {
  if ((CANCELLATION_RULES.free as readonly string[]).includes(status)) return 'free';
  if ((CANCELLATION_RULES.restricted as readonly string[]).includes(status)) return 'restricted';
  if ((CANCELLATION_RULES.disputeOnly as readonly string[]).includes(status)) return 'dispute_only';
  return 'not_allowed';
}
