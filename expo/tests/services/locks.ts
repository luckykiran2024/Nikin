export class AssignmentLockManager {
  private locks = new Map<string, { ownerId: string; at: number; ttlMs: number }>();
  constructor(private now: () => number = () => Date.now()) {}

  tryAcquire(key: string, ownerId: string, ttlMs = 30_000): { acquired: boolean; ownerId: string } {
    const existing = this.locks.get(key);
    const t = this.now();
    if (existing && t - existing.at < existing.ttlMs) {
      return { acquired: existing.ownerId === ownerId, ownerId: existing.ownerId };
    }
    this.locks.set(key, { ownerId, at: t, ttlMs });
    return { acquired: true, ownerId };
  }

  release(key: string, ownerId: string): boolean {
    const existing = this.locks.get(key);
    if (!existing) return false;
    if (existing.ownerId !== ownerId) return false;
    this.locks.delete(key);
    return true;
  }
}

export interface AssignmentResult {
  accepted: boolean;
  travelerId: string;
  reason?: 'already_assigned' | 'locked';
}

export class ShipmentAssignmentService {
  private assigned = new Map<string, string>();
  private locks = new AssignmentLockManager();

  selectTraveler(shipmentId: string, senderId: string, travelerId: string): AssignmentResult {
    const lockKey = `shipment:${shipmentId}`;
    const lock = this.locks.tryAcquire(lockKey, senderId, 5000);
    if (!lock.acquired) {
      if (this.assigned.has(shipmentId)) {
        return { accepted: false, travelerId, reason: 'already_assigned' };
      }
      return { accepted: false, travelerId, reason: 'locked' };
    }
    try {
      if (this.assigned.has(shipmentId)) {
        return { accepted: false, travelerId, reason: 'already_assigned' };
      }
      this.assigned.set(shipmentId, travelerId);
      return { accepted: true, travelerId };
    } finally {
      this.locks.release(lockKey, senderId);
    }
  }

  acceptJob(shipmentId: string, travelerId: string): AssignmentResult {
    const lockKey = `job:${shipmentId}`;
    const lock = this.locks.tryAcquire(lockKey, travelerId, 5000);
    if (!lock.acquired) {
      const current = this.assigned.get(shipmentId);
      if (current && current !== travelerId) {
        return { accepted: false, travelerId, reason: 'already_assigned' };
      }
      return { accepted: false, travelerId, reason: 'locked' };
    }
    try {
      const current = this.assigned.get(shipmentId);
      if (current && current !== travelerId) {
        return { accepted: false, travelerId, reason: 'already_assigned' };
      }
      this.assigned.set(shipmentId, travelerId);
      return { accepted: true, travelerId };
    } finally {
      this.locks.release(lockKey, travelerId);
    }
  }

  getAssigned(shipmentId: string): string | undefined {
    return this.assigned.get(shipmentId);
  }
}
