export const TRUST_LIMITS = {
  MAX_PARCEL_VALUE_INR: 20000,
  MAX_ACTIVE_REQUESTS_PER_SENDER: 5,
  JOB_ACCEPT_WINDOW_MS: 15 * 60 * 1000,
} as const;

export const ACTIVE_SHIPMENT_STATUSES = [
  'created',
  'quoted',
  'pending_acceptance',
  'assigned',
  'payment_pending',
  'confirmed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
] as const;

export const CANCELLATION_RULES = {
  free: ['created', 'quoted'] as const,
  restricted: ['pending_acceptance', 'assigned', 'payment_pending', 'confirmed'] as const,
  disputeOnly: ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'] as const,
};

export function getCancellationStage(status: string): 'free' | 'restricted' | 'dispute_only' | 'not_allowed' {
  if ((CANCELLATION_RULES.free as readonly string[]).includes(status)) return 'free';
  if ((CANCELLATION_RULES.restricted as readonly string[]).includes(status)) return 'restricted';
  if ((CANCELLATION_RULES.disputeOnly as readonly string[]).includes(status)) return 'dispute_only';
  return 'not_allowed';
}
