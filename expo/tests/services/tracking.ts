import { calculateDistance } from '@/utils/validation';

export interface TrackPing {
  at: number;
  lat: number;
  lon: number;
  accuracyM?: number;
  mockProvider?: boolean;
  speedKmh?: number;
}

export interface TrackingAnomaly {
  type: 'spoofing_suspected' | 'static_inactivity' | 'route_deviation' | 'teleport';
  at: number;
  meta?: Record<string, unknown>;
}

export interface TrackingSession {
  shipmentId: string;
  travelerId: string;
  pings: TrackPing[];
  anomalies: TrackingAnomaly[];
  expectedRoute: { lat: number; lon: number }[];
  lastActivityAt: number;
  active: boolean;
}

export const TRACKING_CONFIG = {
  INACTIVITY_MS: 20 * 60 * 1000,
  MAX_TELEPORT_KMH: 900,
  ROUTE_DEVIATION_KM: 15,
};

export class TrackingService {
  private sessions = new Map<string, TrackingSession>();
  constructor(private now: () => number = () => Date.now()) {}

  start(shipmentId: string, travelerId: string, expectedRoute: { lat: number; lon: number }[]): TrackingSession {
    const s: TrackingSession = {
      shipmentId,
      travelerId,
      pings: [],
      anomalies: [],
      expectedRoute,
      lastActivityAt: this.now(),
      active: true,
    };
    this.sessions.set(shipmentId, s);
    return s;
  }

  resume(shipmentId: string): TrackingSession | undefined {
    const s = this.sessions.get(shipmentId);
    if (s) {
      s.active = true;
      s.lastActivityAt = this.now();
    }
    return s;
  }

  pause(shipmentId: string): void {
    const s = this.sessions.get(shipmentId);
    if (s) s.active = false;
  }

  ping(shipmentId: string, ping: TrackPing): TrackingAnomaly[] {
    const s = this.sessions.get(shipmentId);
    if (!s) throw new Error('session_not_found');
    const newAnomalies: TrackingAnomaly[] = [];

    if (ping.mockProvider) {
      newAnomalies.push({ type: 'spoofing_suspected', at: ping.at, meta: { reason: 'mock_provider' } });
    }

    const prev = s.pings[s.pings.length - 1];
    if (prev) {
      const dKm = calculateDistance(prev.lat, prev.lon, ping.lat, ping.lon);
      const dtH = Math.max((ping.at - prev.at) / (1000 * 60 * 60), 1 / 3600);
      const speed = dKm / dtH;
      if (speed > TRACKING_CONFIG.MAX_TELEPORT_KMH) {
        newAnomalies.push({
          type: 'teleport',
          at: ping.at,
          meta: { distanceKm: dKm, speedKmh: Math.round(speed) },
        });
      }
    }

    if (s.expectedRoute.length > 0) {
      const deviationKm = Math.min(
        ...s.expectedRoute.map((p) => calculateDistance(p.lat, p.lon, ping.lat, ping.lon)),
      );
      if (deviationKm > TRACKING_CONFIG.ROUTE_DEVIATION_KM) {
        newAnomalies.push({
          type: 'route_deviation',
          at: ping.at,
          meta: { deviationKm },
        });
      }
    }

    s.pings.push(ping);
    s.lastActivityAt = ping.at;
    s.anomalies.push(...newAnomalies);
    return newAnomalies;
  }

  checkInactivity(shipmentId: string): TrackingAnomaly | null {
    const s = this.sessions.get(shipmentId);
    if (!s) return null;
    if (!s.active) return null;
    const idle = this.now() - s.lastActivityAt;
    if (idle > TRACKING_CONFIG.INACTIVITY_MS) {
      const anomaly: TrackingAnomaly = {
        type: 'static_inactivity',
        at: this.now(),
        meta: { idleMs: idle },
      };
      s.anomalies.push(anomaly);
      return anomaly;
    }
    return null;
  }

  snapshot(shipmentId: string): TrackingSession | undefined {
    return this.sessions.get(shipmentId);
  }
}
