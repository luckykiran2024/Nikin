export type NotificationChannel = 'push' | 'sms' | 'email' | 'inapp';
export type NotificationKind =
  | 'quote_received'
  | 'assignment'
  | 'otp_sms'
  | 'payment_success'
  | 'delivery_confirmed'
  | 'dispute_update';

export interface OutboundNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
  createdAt: number;
  deliveredAt?: number;
  failed?: boolean;
  fallbackChannel?: NotificationChannel;
  attempts: number;
}

export interface ChannelDriver {
  send(n: OutboundNotification): Promise<boolean> | boolean;
}

export class NotificationCenter {
  private outbox: OutboundNotification[] = [];
  constructor(
    private drivers: Record<NotificationChannel, ChannelDriver>,
    private now: () => number = () => Date.now(),
    public maxAttempts = 2,
  ) {}

  async send(
    userId: string,
    kind: NotificationKind,
    channel: NotificationChannel,
    payload: Record<string, unknown>,
    fallback?: NotificationChannel,
  ): Promise<OutboundNotification> {
    const n: OutboundNotification = {
      id: `${kind}_${userId}_${this.outbox.length}`,
      userId,
      kind,
      channel,
      payload,
      createdAt: this.now(),
      attempts: 0,
      fallbackChannel: fallback,
    };
    this.outbox.push(n);

    let ok = false;
    while (n.attempts < this.maxAttempts && !ok) {
      n.attempts += 1;
      try {
        ok = await this.drivers[n.channel].send(n);
      } catch {
        ok = false;
      }
    }
    if (!ok && fallback) {
      n.channel = fallback;
      n.attempts = 0;
      while (n.attempts < this.maxAttempts && !ok) {
        n.attempts += 1;
        try {
          ok = await this.drivers[fallback].send(n);
        } catch {
          ok = false;
        }
      }
    }
    if (ok) n.deliveredAt = this.now();
    else n.failed = true;
    return n;
  }

  all(): OutboundNotification[] {
    return [...this.outbox];
  }

  byKind(kind: NotificationKind): OutboundNotification[] {
    return this.outbox.filter((n) => n.kind === kind);
  }
}
