import type { ShipmentStatus } from '@/types';

export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  created: ['quoted', 'cancelled'],
  quoted: ['pending_acceptance', 'cancelled', 'created'],
  pending_acceptance: ['assigned', 'quoted', 'cancelled'],
  assigned: ['payment_pending', 'confirmed', 'pickup_delayed', 'no_show', 'quoted', 'cancelled'],
  payment_pending: ['confirmed', 'cancelled'],
  confirmed: ['picked_up', 'pickup_delayed', 'no_show', 'cancelled'],
  pickup_delayed: ['picked_up', 'no_show', 'quoted', 'cancelled'],
  no_show: ['quoted', 'cancelled'],
  picked_up: ['in_transit', 'out_for_delivery'],
  in_transit: ['out_for_delivery', 'delivery_attempted', 'delivered'],
  out_for_delivery: ['delivered', 'delivery_attempted'],
  delivery_attempted: ['in_transit', 'out_for_delivery', 'returning', 'delivered'],
  delivered: ['completed'],
  returning: ['returned'],
  returned: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return true;
  const allowed = SHIPMENT_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: ShipmentStatus, to: ShipmentStatus) {
    super(`Invalid shipment state transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}
