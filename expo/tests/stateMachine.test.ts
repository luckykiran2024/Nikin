import { describe, it, expect } from 'bun:test';
import { canTransition, SHIPMENT_TRANSITIONS } from '@/backend/db/stateMachine';
import type { ShipmentStatus } from '@/types';

describe('Shipment state machine', () => {
  it('allows listed transitions', () => {
    (Object.entries(SHIPMENT_TRANSITIONS) as [ShipmentStatus, ShipmentStatus[]][]).forEach(
      ([from, nexts]) => {
        for (const to of nexts) {
          expect(canTransition(from, to)).toBe(true);
        }
      },
    );
  });

  it('blocks transitions not listed', () => {
    expect(canTransition('created', 'delivered')).toBe(false);
    expect(canTransition('completed', 'created')).toBe(false);
    expect(canTransition('delivered', 'in_transit')).toBe(false);
  });

  it('same-state is idempotent', () => {
    expect(canTransition('in_transit', 'in_transit')).toBe(true);
  });
});
