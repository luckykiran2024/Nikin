export type PaymentState =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentRecord {
  id: string;
  shipmentId: string;
  amount: number;
  tip: number;
  state: PaymentState;
  captureAttempts: number;
  refundedAmount: number;
  history: { at: number; state: PaymentState; note?: string }[];
}

export interface PaymentSplit {
  gross: number;
  platformFee: number;
  traveler: number;
  tip: number;
}

const PLATFORM_FEE_BPS = 1500;

export function splitPayment(amount: number, tip = 0): PaymentSplit {
  const platformFee = Math.round((amount * PLATFORM_FEE_BPS) / 10000);
  const traveler = amount - platformFee + tip;
  return { gross: amount + tip, platformFee, traveler, tip };
}

export class PaymentService {
  private store = new Map<string, PaymentRecord>();
  constructor(
    private now: () => number = () => Date.now(),
    public maxCaptureAttempts = 3,
  ) {}

  authorize(id: string, shipmentId: string, amount: number): PaymentRecord {
    const rec: PaymentRecord = {
      id,
      shipmentId,
      amount,
      tip: 0,
      state: 'authorized',
      captureAttempts: 0,
      refundedAmount: 0,
      history: [{ at: this.now(), state: 'authorized' }],
    };
    this.store.set(id, rec);
    return rec;
  }

  capture(id: string, opts?: { failOnce?: boolean }): { ok: boolean; state: PaymentState } {
    const rec = this.store.get(id);
    if (!rec) throw new Error('payment_not_found');
    if (rec.state === 'captured') return { ok: true, state: 'captured' };
    if (rec.state !== 'authorized') return { ok: false, state: rec.state };
    rec.captureAttempts += 1;
    if (opts?.failOnce && rec.captureAttempts === 1) {
      rec.history.push({ at: this.now(), state: 'authorized', note: 'capture_failed_retry' });
      return { ok: false, state: 'authorized' };
    }
    if (rec.captureAttempts > this.maxCaptureAttempts) {
      rec.state = 'failed';
      rec.history.push({ at: this.now(), state: 'failed', note: 'max_capture_attempts' });
      return { ok: false, state: 'failed' };
    }
    rec.state = 'captured';
    rec.history.push({ at: this.now(), state: 'captured' });
    return { ok: true, state: 'captured' };
  }

  void(id: string): boolean {
    const rec = this.store.get(id);
    if (!rec) return false;
    if (rec.state !== 'authorized') return false;
    rec.state = 'failed';
    rec.history.push({ at: this.now(), state: 'failed', note: 'voided' });
    return true;
  }

  refund(id: string, amount?: number): { ok: boolean; refundedAmount: number; state: PaymentState } {
    const rec = this.store.get(id);
    if (!rec) throw new Error('payment_not_found');
    if (rec.state !== 'captured' && rec.state !== 'partially_refunded') {
      return { ok: false, refundedAmount: rec.refundedAmount, state: rec.state };
    }
    const total = rec.amount + rec.tip;
    const refundAmount = Math.min(amount ?? total - rec.refundedAmount, total - rec.refundedAmount);
    rec.refundedAmount += refundAmount;
    rec.state = rec.refundedAmount >= total ? 'refunded' : 'partially_refunded';
    rec.history.push({ at: this.now(), state: rec.state, note: `refund_${refundAmount}` });
    return { ok: true, refundedAmount: rec.refundedAmount, state: rec.state };
  }

  addTip(id: string, tip: number): PaymentSplit {
    const rec = this.store.get(id);
    if (!rec) throw new Error('payment_not_found');
    if (rec.state !== 'captured') throw new Error('tip_requires_captured');
    rec.tip += tip;
    rec.history.push({ at: this.now(), state: rec.state, note: `tip_${tip}` });
    return splitPayment(rec.amount, rec.tip);
  }

  get(id: string): PaymentRecord | undefined {
    return this.store.get(id);
  }
}
