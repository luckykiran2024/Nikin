import { TRUST_LIMITS } from '@/constants/trustLimits';

export interface FraudEvent {
  userId: string;
  type: 'cancellation' | 'dispute' | 'high_value_request' | 'inactivity';
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface FraudFlags {
  flagged: boolean;
  reasons: string[];
  cancellations7d: number;
  disputes30d: number;
  highValue24h: number;
}

const DAY = 24 * 60 * 60 * 1000;

export class FraudMonitor {
  private events: FraudEvent[] = [];
  constructor(private now: () => number = () => Date.now()) {}

  record(event: Omit<FraudEvent, 'timestamp'> & { timestamp?: number }): void {
    this.events.push({
      ...event,
      timestamp: event.timestamp ?? this.now(),
    });
  }

  evaluate(userId: string): FraudFlags {
    const t = this.now();
    const userEvents = this.events.filter((e) => e.userId === userId);
    const cancellations7d = userEvents.filter(
      (e) => e.type === 'cancellation' && t - e.timestamp <= 7 * DAY,
    ).length;
    const disputes30d = userEvents.filter(
      (e) => e.type === 'dispute' && t - e.timestamp <= 30 * DAY,
    ).length;
    const highValue24h = userEvents.filter(
      (e) => e.type === 'high_value_request' && t - e.timestamp <= DAY,
    ).length;

    const reasons: string[] = [];
    if (cancellations7d > TRUST_LIMITS.FRAUD_MAX_CANCELLATIONS_7D) {
      reasons.push('excessive_cancellations_7d');
    }
    if (disputes30d > TRUST_LIMITS.FRAUD_MAX_DISPUTES_30D) {
      reasons.push('excessive_disputes_30d');
    }
    if (highValue24h > TRUST_LIMITS.FRAUD_MAX_HIGH_VALUE_24H) {
      reasons.push('excessive_high_value_requests_24h');
    }

    return {
      flagged: reasons.length > 0,
      reasons,
      cancellations7d,
      disputes30d,
      highValue24h,
    };
  }

  shouldAllowRequest(userId: string, valueInr: number): { allowed: boolean; reason?: string } {
    if (valueInr > TRUST_LIMITS.MAX_PARCEL_VALUE_INR) {
      return { allowed: false, reason: 'value_exceeds_limit' };
    }
    const flags = this.evaluate(userId);
    if (flags.flagged) {
      return { allowed: false, reason: flags.reasons[0] };
    }
    if (
      valueInr >= TRUST_LIMITS.HIGH_VALUE_THRESHOLD_INR &&
      flags.highValue24h >= TRUST_LIMITS.FRAUD_MAX_HIGH_VALUE_24H
    ) {
      return { allowed: false, reason: 'high_value_rate_limited' };
    }
    return { allowed: true };
  }
}
