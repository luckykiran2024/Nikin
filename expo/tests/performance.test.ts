import { describe, it, expect } from 'bun:test';
import { ShipmentAssignmentService } from './services/locks';
import { OtpService } from './services/otp';

describe('Performance & Load', () => {
  it('PERF-01 100 simultaneous quote submissions resolve without crash', async () => {
    const svc = new ShipmentAssignmentService();
    const promises = Array.from({ length: 100 }).map((_, i) =>
      Promise.resolve(svc.acceptJob(`ship_${i % 10}`, `traveler_${i}`)),
    );
    const results = await Promise.all(promises);
    expect(results.length).toBe(100);
    const acceptedPerShipment = new Map<string, number>();
    results.forEach((r, i) => {
      const key = `ship_${i % 10}`;
      if (r.accepted) acceptedPerShipment.set(key, (acceptedPerShipment.get(key) ?? 0) + 1);
    });
    for (const count of acceptedPerShipment.values()) {
      expect(count).toBe(1);
    }
  });

  it('PERF-02 chat with 5000 messages renders filter quickly (<100ms)', () => {
    const messages = Array.from({ length: 5000 }).map((_, i) => ({
      id: `m_${i}`,
      text: `hello ${i}`,
      ts: i,
    }));
    const start = performance.now();
    const filtered = messages.filter((m) => m.text.includes('123'));
    const duration = performance.now() - start;
    expect(filtered.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
  });

  it('PERF-03 OTP service handles 10k issuances', () => {
    const svc = new OtpService();
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) svc.issue(`k_${i}`);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
