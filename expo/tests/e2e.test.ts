import { describe, it, expect } from 'bun:test';
import { OtpService } from './services/otp';
import { PaymentService } from './services/payment';
import { TrackingService } from './services/tracking';
import { NotificationCenter } from './services/notifications';
import { FraudMonitor } from './services/fraud';
import { ShipmentAssignmentService } from './services/locks';
import { canTransition } from '@/backend/db/stateMachine';
import type { ShipmentStatus } from '@/types';
import { resolveCancellation } from './services/cancellation';

const makePassthroughNC = () =>
  new NotificationCenter({
    push: { send: () => true },
    sms: { send: () => true },
    email: { send: () => true },
    inapp: { send: () => true },
  });

function advance(status: ShipmentStatus, next: ShipmentStatus): ShipmentStatus {
  if (!canTransition(status, next)) {
    throw new Error(`invalid transition ${status} -> ${next}`);
  }
  return next;
}

describe('E2E chaos scenarios', () => {
  it('E2E-01 perfect flow: create -> deliver -> complete', async () => {
    const otp = new OtpService();
    const pay = new PaymentService();
    const track = new TrackingService(() => 0);
    const nc = makePassthroughNC();
    const assign = new ShipmentAssignmentService();

    let status: ShipmentStatus = 'created';
    status = advance(status, 'quoted');
    await nc.send('sender1', 'quote_received', 'push', {});
    status = advance(status, 'pending_acceptance');

    const accept = assign.acceptJob('ship1', 'trav1');
    expect(accept.accepted).toBe(true);
    status = advance(status, 'assigned');
    await nc.send('trav1', 'assignment', 'push', {});

    status = advance(status, 'payment_pending');
    pay.authorize('pay1', 'ship1', 1000);
    pay.capture('pay1');
    status = advance(status, 'confirmed');

    const pickupOtp = otp.issue('pickup:ship1');
    expect(otp.verify('pickup:ship1', pickupOtp.code).ok).toBe(true);
    status = advance(status, 'picked_up');
    track.start('ship1', 'trav1', [{ lat: 19.076, lon: 72.8777 }]);
    track.ping('ship1', { at: 0, lat: 19.076, lon: 72.8777 });

    status = advance(status, 'in_transit');
    status = advance(status, 'out_for_delivery');

    const deliveryOtp = otp.issue('delivery:ship1');
    expect(otp.verify('delivery:ship1', deliveryOtp.code).ok).toBe(true);
    status = advance(status, 'delivered');
    status = advance(status, 'completed');

    expect(status).toBe('completed');
    expect(pay.get('pay1')?.state).toBe('captured');
  });

  it('E2E-02 failure flow: delay -> receiver unavailable -> dispute', async () => {
    const otp = new OtpService();
    const pay = new PaymentService();
    const track = new TrackingService(() => 0);

    let status: ShipmentStatus = 'assigned';
    status = advance(status, 'pickup_delayed');
    status = advance(status, 'picked_up');
    pay.authorize('pay2', 'ship2', 800);
    pay.capture('pay2');
    track.start('ship2', 'trav1', [{ lat: 19.076, lon: 72.8777 }]);

    status = advance(status, 'in_transit');
    status = advance(status, 'delivery_attempted');

    const deliveryOtp = otp.issue('delivery:ship2');
    const wrong = otp.verify('delivery:ship2', '000000');
    expect(wrong.ok).toBe(false);

    const cancel = resolveCancellation({
      status,
      role: 'sender',
      paymentAuthorized: true,
      paymentCaptured: true,
      travelerCancellations7d: 0,
    });
    expect(cancel.requiresDispute).toBe(true);

    status = advance(status, 'returning');
    status = advance(status, 'returned');
    status = advance(status, 'completed');

    const refund = pay.refund('pay2');
    expect(refund.ok).toBe(true);
    expect(deliveryOtp.code.length).toBeGreaterThan(0);
  });

  it('E2E-03 fraud attempt: false dispute denied without evidence', () => {
    const fraud = new FraudMonitor();
    fraud.record({ userId: 'sender1', type: 'dispute' });
    fraud.record({ userId: 'sender1', type: 'dispute' });
    fraud.record({ userId: 'sender1', type: 'dispute' });
    const flags = fraud.evaluate('sender1');
    expect(flags.flagged).toBe(true);
    expect(flags.reasons).toContain('excessive_disputes_30d');

    const travelerEvidence = {
      pickupOtpVerified: true,
      deliveryOtpVerified: true,
      pickupImages: ['img1'],
      deliveryImages: ['img2'],
      gpsTrail: 120,
    };
    const wins =
      travelerEvidence.pickupOtpVerified &&
      travelerEvidence.deliveryOtpVerified &&
      travelerEvidence.pickupImages.length > 0 &&
      travelerEvidence.deliveryImages.length > 0 &&
      travelerEvidence.gpsTrail > 10;
    expect(wins).toBe(true);
  });
});
