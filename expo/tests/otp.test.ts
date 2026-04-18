import { describe, it, expect } from 'bun:test';
import { OtpService, DEFAULT_OTP_CONFIG } from './services/otp';

const makeService = (clockRef: { t: number }) =>
  new OtpService(
    DEFAULT_OTP_CONFIG,
    () => clockRef.t,
    (() => {
      let i = 0;
      const codes = ['111111', '222222', '333333'];
      return () => codes[i++ % codes.length];
    })(),
  );

describe('OTP Edge Cases', () => {
  it('OTP-01 expired OTP fails after TTL', () => {
    const clock = { t: 1_000_000 };
    const svc = makeService(clock);
    svc.issue('ship:1');
    clock.t += DEFAULT_OTP_CONFIG.ttlMs + 1;
    const res = svc.verify('ship:1', '111111');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('expired');
  });

  it('OTP-02 locks after maxAttempts wrong entries', () => {
    const clock = { t: 0 };
    const svc = makeService(clock);
    svc.issue('ship:2');
    for (let i = 0; i < DEFAULT_OTP_CONFIG.maxAttempts - 1; i++) {
      const r = svc.verify('ship:2', '000000');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('invalid');
    }
    const last = svc.verify('ship:2', '000000');
    expect(last.ok).toBe(false);
    if (!last.ok) expect(last.reason).toBe('locked');

    const stillLocked = svc.verify('ship:2', '111111');
    expect(stillLocked.ok).toBe(false);
    if (!stillLocked.ok) expect(stillLocked.reason).toBe('locked');
  });

  it('OTP-02b lock releases after lockMs (requires resend if TTL elapsed)', () => {
    const clock = { t: 0 };
    const svc = makeService(clock);
    svc.issue('ship:2b');
    for (let i = 0; i < DEFAULT_OTP_CONFIG.maxAttempts; i++) svc.verify('ship:2b', 'wrong0');
    clock.t += DEFAULT_OTP_CONFIG.lockMs + 1;
    const resent = svc.resend('ship:2b');
    const r = svc.verify('ship:2b', resent.code);
    expect(r.ok).toBe(true);
  });

  it('OTP-03 resend invalidates old code', () => {
    const clock = { t: 0 };
    const svc = makeService(clock);
    svc.issue('ship:3');
    svc.resend('ship:3');
    const old = svc.verify('ship:3', '111111');
    expect(old.ok).toBe(false);
    const next = svc.verify('ship:3', '222222');
    expect(next.ok).toBe(true);
  });

  it('OTP consumed cannot be reused', () => {
    const clock = { t: 0 };
    const svc = makeService(clock);
    svc.issue('ship:4');
    expect(svc.verify('ship:4', '111111').ok).toBe(true);
    const again = svc.verify('ship:4', '111111');
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe('consumed');
  });
});
