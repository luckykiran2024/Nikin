import { describe, it, expect } from 'bun:test';
import { PaymentService, splitPayment } from './services/payment';

describe('Payment Edge Cases', () => {
  it('PAY-06 authorized but capture fails midway -> retry capture succeeds', () => {
    const svc = new PaymentService();
    svc.authorize('p1', 's1', 1000);
    const first = svc.capture('p1', { failOnce: true });
    expect(first.ok).toBe(false);
    expect(first.state).toBe('authorized');
    const retry = svc.capture('p1');
    expect(retry.ok).toBe(true);
    expect(retry.state).toBe('captured');
  });

  it('PAY-06b capture eventually fails after max attempts -> fallback to failed', () => {
    const svc = new PaymentService(() => Date.now(), 0);
    svc.authorize('p1b', 's1', 1000);
    const r = svc.capture('p1b');
    expect(r.ok).toBe(false);
    expect(r.state).toBe('failed');
  });

  it('PAY-07 refund after dispute syncs state', () => {
    const svc = new PaymentService();
    svc.authorize('p2', 's2', 2000);
    svc.capture('p2');
    const r = svc.refund('p2');
    expect(r.ok).toBe(true);
    expect(r.state).toBe('refunded');
    expect(r.refundedAmount).toBe(2000);
  });

  it('PAY-07b partial refund leaves state partially_refunded', () => {
    const svc = new PaymentService();
    svc.authorize('p2b', 's2', 2000);
    svc.capture('p2b');
    const r = svc.refund('p2b', 500);
    expect(r.state).toBe('partially_refunded');
    expect(r.refundedAmount).toBe(500);
  });

  it('PAY-08 tip after delivery produces correct split', () => {
    const svc = new PaymentService();
    svc.authorize('p3', 's3', 1000);
    svc.capture('p3');
    const split = svc.addTip('p3', 200);
    const expected = splitPayment(1000, 200);
    expect(split).toEqual(expected);
    expect(split.gross).toBe(1200);
    expect(split.traveler).toBe(1000 - expected.platformFee + 200);
  });

  it('refund on non-captured payment is rejected', () => {
    const svc = new PaymentService();
    svc.authorize('p4', 's4', 500);
    const r = svc.refund('p4');
    expect(r.ok).toBe(false);
  });

  it('void releases authorized hold', () => {
    const svc = new PaymentService();
    svc.authorize('p5', 's5', 700);
    expect(svc.void('p5')).toBe(true);
    expect(svc.get('p5')!.state).toBe('failed');
  });
});
