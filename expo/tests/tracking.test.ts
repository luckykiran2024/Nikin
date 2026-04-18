import { describe, it, expect } from 'bun:test';
import { TrackingService, TRACKING_CONFIG } from './services/tracking';

describe('GPS / Tracking Failures', () => {
  it('TR-05 GPS spoofing: mock provider flagged', () => {
    const svc = new TrackingService(() => 0);
    svc.start('s1', 't1', [{ lat: 19.076, lon: 72.8777 }]);
    const anomalies = svc.ping('s1', { at: 0, lat: 19.076, lon: 72.8777, mockProvider: true });
    expect(anomalies.some((a) => a.type === 'spoofing_suspected')).toBe(true);
  });

  it('TR-05b teleport-speed jump flagged', () => {
    const now = { t: 0 };
    const svc = new TrackingService(() => now.t);
    svc.start('s2', 't1', [{ lat: 19.076, lon: 72.8777 }]);
    svc.ping('s2', { at: now.t, lat: 19.076, lon: 72.8777 });
    now.t += 60_000;
    const a = svc.ping('s2', { at: now.t, lat: 28.6139, lon: 77.209 });
    expect(a.some((x) => x.type === 'teleport')).toBe(true);
  });

  it('TR-06 route deviation flagged', () => {
    const svc = new TrackingService(() => 0);
    svc.start('s3', 't1', [
      { lat: 19.076, lon: 72.8777 },
      { lat: 19.2, lon: 72.9 },
    ]);
    const a = svc.ping('s3', { at: 0, lat: 28.6, lon: 77.2 });
    expect(a.some((x) => x.type === 'route_deviation')).toBe(true);
  });

  it('TR-07 app killed & reopened: session resumes, ping continues', () => {
    const now = { t: 0 };
    const svc = new TrackingService(() => now.t);
    svc.start('s4', 't1', [{ lat: 19.076, lon: 72.8777 }]);
    svc.ping('s4', { at: now.t, lat: 19.076, lon: 72.8777 });
    svc.pause('s4');
    now.t += 5 * 60_000;
    const resumed = svc.resume('s4');
    expect(resumed?.active).toBe(true);
    const a = svc.ping('s4', { at: now.t, lat: 19.08, lon: 72.88 });
    expect(a.length).toBe(0);
  });

  it('inactivity only triggers when active', () => {
    const now = { t: 0 };
    const svc = new TrackingService(() => now.t);
    svc.start('s5', 't1', [{ lat: 19.076, lon: 72.8777 }]);
    svc.pause('s5');
    now.t += TRACKING_CONFIG.INACTIVITY_MS + 1;
    expect(svc.checkInactivity('s5')).toBeNull();
  });
});
