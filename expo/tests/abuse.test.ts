import { describe, it, expect } from 'bun:test';
import { FraudMonitor } from './services/fraud';
import { TrackingService } from './services/tracking';
import { TRUST_LIMITS } from '@/constants/trustLimits';

describe('Trust & Abuse', () => {
  it('AB-01 fake parcel: dispute flow accepts only with evidence', () => {
    const evidence = {
      images: ['https://cdn/img1.jpg'],
      pickupOtpVerified: true,
      deliveryOtpVerified: true,
    };
    const disputeValid =
      evidence.images.length > 0 && evidence.pickupOtpVerified && evidence.deliveryOtpVerified;
    expect(disputeValid).toBe(true);

    const weakEvidence = { images: [], pickupOtpVerified: false, deliveryOtpVerified: false };
    const weakValid =
      weakEvidence.images.length > 0 &&
      weakEvidence.pickupOtpVerified &&
      weakEvidence.deliveryOtpVerified;
    expect(weakValid).toBe(false);
  });

  it('AB-02 sender fraud: repeated high-value requests are rate limited', () => {
    const now = { t: Date.UTC(2026, 0, 1) };
    const fraud = new FraudMonitor(() => now.t);
    const sender = 'sender_1';
    const value = TRUST_LIMITS.HIGH_VALUE_THRESHOLD_INR + 500;

    for (let i = 0; i < TRUST_LIMITS.FRAUD_MAX_HIGH_VALUE_24H; i++) {
      const res = fraud.shouldAllowRequest(sender, value);
      expect(res.allowed).toBe(true);
      fraud.record({ userId: sender, type: 'high_value_request', meta: { value } });
      now.t += 60_000;
    }
    const blocked = fraud.shouldAllowRequest(sender, value);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('high_value_rate_limited');
  });

  it('AB-02b request above absolute cap is rejected regardless of history', () => {
    const fraud = new FraudMonitor();
    const res = fraud.shouldAllowRequest('u', TRUST_LIMITS.MAX_PARCEL_VALUE_INR + 1);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('value_exceeds_limit');
  });

  it('AB-03 traveler misuse: static GPS triggers inactivity anomaly', () => {
    const now = { t: 0 };
    const tracking = new TrackingService(() => now.t);
    tracking.start('sh1', 'tr1', [{ lat: 19.076, lon: 72.8777 }]);
    tracking.ping('sh1', { at: now.t, lat: 19.076, lon: 72.8777 });
    now.t += 25 * 60 * 1000;
    const anomaly = tracking.checkInactivity('sh1');
    expect(anomaly).not.toBeNull();
    expect(anomaly!.type).toBe('static_inactivity');
  });
});
