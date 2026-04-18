import type { ShipmentStatus } from '@/types';
import { getCancellationStage } from '@/constants/trustLimits';

export interface CancellationContext {
  status: ShipmentStatus;
  role: 'sender' | 'traveler' | 'admin';
  paymentAuthorized: boolean;
  paymentCaptured: boolean;
  travelerCancellations7d: number;
}

export interface CancellationOutcome {
  allowed: boolean;
  requiresDispute: boolean;
  refund: 'full' | 'partial' | 'none' | 'void_auth';
  penalty: number;
  reason?: string;
}

export function resolveCancellation(ctx: CancellationContext): CancellationOutcome {
  const stage = getCancellationStage(ctx.status);
  if (stage === 'not_allowed') {
    return { allowed: false, requiresDispute: false, refund: 'none', penalty: 0, reason: 'terminal_state' };
  }
  if (stage === 'dispute_only') {
    return {
      allowed: false,
      requiresDispute: true,
      refund: 'none',
      penalty: 0,
      reason: 'open_dispute_instead',
    };
  }

  let refund: CancellationOutcome['refund'] = 'full';
  if (ctx.paymentCaptured) refund = 'full';
  else if (ctx.paymentAuthorized) refund = 'void_auth';
  else refund = 'none';

  let penalty = 0;
  if (ctx.role === 'traveler') {
    if (ctx.travelerCancellations7d >= 3) penalty = 500;
    else if (ctx.travelerCancellations7d >= 1) penalty = 100;
  }

  if (stage === 'restricted' && ctx.role === 'sender') {
    refund = refund === 'full' ? 'partial' : refund;
  }

  return { allowed: true, requiresDispute: false, refund, penalty };
}
