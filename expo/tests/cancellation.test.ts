import { describe, it, expect } from 'bun:test';
import { resolveCancellation } from './services/cancellation';
import { canTransition } from '@/backend/db/stateMachine';

describe('Cancellation Edge Cases', () => {
  it('CAN-01 cancel after assignment + payment authorized -> void auth', () => {
    const r = resolveCancellation({
      status: 'assigned',
      role: 'sender',
      paymentAuthorized: true,
      paymentCaptured: false,
      travelerCancellations7d: 0,
    });
    expect(r.allowed).toBe(true);
    expect(r.refund).toBe('void_auth');
  });

  it('CAN-01b cancel after capture -> refund processed', () => {
    const r = resolveCancellation({
      status: 'confirmed',
      role: 'sender',
      paymentAuthorized: true,
      paymentCaptured: true,
      travelerCancellations7d: 0,
    });
    expect(r.allowed).toBe(true);
    expect(['full', 'partial']).toContain(r.refund);
  });

  it('CAN-02 traveler repeated cancellations get penalty', () => {
    const low = resolveCancellation({
      status: 'assigned',
      role: 'traveler',
      paymentAuthorized: false,
      paymentCaptured: false,
      travelerCancellations7d: 1,
    });
    expect(low.penalty).toBe(100);
    const high = resolveCancellation({
      status: 'assigned',
      role: 'traveler',
      paymentAuthorized: false,
      paymentCaptured: false,
      travelerCancellations7d: 5,
    });
    expect(high.penalty).toBe(500);
  });

  it('in-transit cancellation requires dispute', () => {
    const r = resolveCancellation({
      status: 'in_transit',
      role: 'sender',
      paymentAuthorized: true,
      paymentCaptured: true,
      travelerCancellations7d: 0,
    });
    expect(r.allowed).toBe(false);
    expect(r.requiresDispute).toBe(true);
  });

  it('state machine: cancelled is terminal', () => {
    expect(canTransition('cancelled', 'quoted')).toBe(false);
    expect(canTransition('quoted', 'cancelled')).toBe(true);
  });
});
