import { describe, it, expect } from 'bun:test';
import { ShipmentAssignmentService } from './services/locks';

describe('Concurrency', () => {
  it('CON-01 two senders selecting same traveler simultaneously: first wins', () => {
    const svc = new ShipmentAssignmentService();
    const a = svc.selectTraveler('shipA', 'sender1', 'traveler1');
    const b = svc.selectTraveler('shipA', 'sender2', 'traveler1');
    expect(a.accepted).toBe(true);
    expect(b.accepted).toBe(false);
    expect(b.reason).toBe('already_assigned');
  });

  it('CON-02 two travelers accepting same job: first confirmed wins', () => {
    const svc = new ShipmentAssignmentService();
    const a = svc.acceptJob('shipB', 'travelerA');
    const b = svc.acceptJob('shipB', 'travelerB');
    expect(a.accepted).toBe(true);
    expect(b.accepted).toBe(false);
    expect(b.reason).toBe('already_assigned');
    expect(svc.getAssigned('shipB')).toBe('travelerA');
  });

  it('same owner re-entering is idempotent', () => {
    const svc = new ShipmentAssignmentService();
    svc.acceptJob('shipC', 'travelerA');
    const again = svc.acceptJob('shipC', 'travelerA');
    expect(again.accepted).toBe(true);
  });
});
