export interface OtpRecord {
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  locked: boolean;
  lockedUntil?: number;
  consumed: boolean;
}

export interface OtpConfig {
  ttlMs: number;
  maxAttempts: number;
  lockMs: number;
  length: number;
}

export const DEFAULT_OTP_CONFIG: OtpConfig = {
  ttlMs: 5 * 60 * 1000,
  maxAttempts: 5,
  lockMs: 15 * 60 * 1000,
  length: 6,
};

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'expired' | 'invalid' | 'locked' | 'not_found' | 'consumed'; attemptsLeft?: number };

export class OtpService {
  private store = new Map<string, OtpRecord>();
  constructor(
    private config: OtpConfig = DEFAULT_OTP_CONFIG,
    private now: () => number = () => Date.now(),
    private generator: () => string = () =>
      Math.floor(100000 + Math.random() * 900000).toString(),
  ) {}

  issue(key: string): OtpRecord {
    const createdAt = this.now();
    const rec: OtpRecord = {
      code: this.generator(),
      createdAt,
      expiresAt: createdAt + this.config.ttlMs,
      attempts: 0,
      locked: false,
      consumed: false,
    };
    this.store.set(key, rec);
    return rec;
  }

  resend(key: string): OtpRecord {
    return this.issue(key);
  }

  peek(key: string): OtpRecord | undefined {
    return this.store.get(key);
  }

  verify(key: string, code: string): OtpVerifyResult {
    const rec = this.store.get(key);
    if (!rec) return { ok: false, reason: 'not_found' };
    const t = this.now();
    if (rec.locked && rec.lockedUntil && t < rec.lockedUntil) {
      return { ok: false, reason: 'locked' };
    }
    if (rec.locked && rec.lockedUntil && t >= rec.lockedUntil) {
      rec.locked = false;
      rec.attempts = 0;
    }
    if (rec.consumed) return { ok: false, reason: 'consumed' };
    if (t > rec.expiresAt) return { ok: false, reason: 'expired' };

    if (rec.code === code) {
      rec.consumed = true;
      return { ok: true };
    }
    rec.attempts += 1;
    if (rec.attempts >= this.config.maxAttempts) {
      rec.locked = true;
      rec.lockedUntil = t + this.config.lockMs;
      return { ok: false, reason: 'locked', attemptsLeft: 0 };
    }
    return {
      ok: false,
      reason: 'invalid',
      attemptsLeft: this.config.maxAttempts - rec.attempts,
    };
  }
}
