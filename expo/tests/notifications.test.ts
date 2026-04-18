import { describe, it, expect } from 'bun:test';
import { NotificationCenter, type ChannelDriver } from './services/notifications';

const makeDriver = (failCount = 0): ChannelDriver & { calls: number } => {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    send: () => {
      calls += 1;
      if (calls <= failCount) return false;
      return true;
    },
  } as ChannelDriver & { calls: number };
};

describe('Notifications', () => {
  it('NTF-01 quote received notification is queued and delivered', async () => {
    const push = makeDriver();
    const nc = new NotificationCenter({
      push,
      sms: makeDriver(),
      email: makeDriver(),
      inapp: makeDriver(),
    });
    const n = await nc.send('sender1', 'quote_received', 'push', { quoteId: 'q1' });
    expect(n.deliveredAt).toBeTruthy();
    expect(nc.byKind('quote_received').length).toBe(1);
  });

  it('NTF-02 assignment notification delivered via push', async () => {
    const nc = new NotificationCenter({
      push: makeDriver(),
      sms: makeDriver(),
      email: makeDriver(),
      inapp: makeDriver(),
    });
    const n = await nc.send('tr1', 'assignment', 'push', { shipmentId: 's1' });
    expect(n.failed).toBeUndefined();
  });

  it('NTF-03 OTP SMS delivery retries then succeeds', async () => {
    const sms = makeDriver(1);
    const nc = new NotificationCenter({
      push: makeDriver(),
      sms,
      email: makeDriver(),
      inapp: makeDriver(),
    });
    const n = await nc.send('u1', 'otp_sms', 'sms', { code: '123456' });
    expect(n.deliveredAt).toBeTruthy();
    expect(n.attempts).toBeGreaterThanOrEqual(2);
  });

  it('NTF-04 push failure falls back to sms', async () => {
    const push = makeDriver(99);
    const sms = makeDriver();
    const nc = new NotificationCenter({
      push,
      sms,
      email: makeDriver(),
      inapp: makeDriver(),
    });
    const n = await nc.send('u2', 'assignment', 'push', { shipmentId: 's' }, 'sms');
    expect(n.channel).toBe('sms');
    expect(n.deliveredAt).toBeTruthy();
  });

  it('all channels failing marks failed', async () => {
    const nc = new NotificationCenter({
      push: makeDriver(99),
      sms: makeDriver(99),
      email: makeDriver(99),
      inapp: makeDriver(99),
    });
    const n = await nc.send('u3', 'assignment', 'push', {}, 'sms');
    expect(n.failed).toBe(true);
  });
});
