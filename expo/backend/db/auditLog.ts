export type AuditActor = 'sender' | 'traveler' | 'admin' | 'system' | 'webhook';

export interface AuditLogEntry {
  id: string;
  entityType: 'shipment' | 'payment' | 'user' | 'dispute' | 'kyc';
  entityId: string;
  action: string;
  actorId?: string;
  actorRole: AuditActor;
  fromState?: string;
  toState?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ip?: string;
}

class AuditLog {
  private entries: AuditLogEntry[] = [];
  private maxEntries = 10000;

  record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(log);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    console.log(
      `[AUDIT] ${log.entityType}:${log.entityId} ${log.action}`,
      log.fromState ? `${log.fromState}->${log.toState}` : '',
      `by ${log.actorRole}:${log.actorId ?? 'n/a'}`,
    );
    return log;
  }

  getByEntity(entityType: AuditLogEntry['entityType'], entityId: string): AuditLogEntry[] {
    return this.entries.filter(e => e.entityType === entityType && e.entityId === entityId);
  }

  getByActor(actorId: string): AuditLogEntry[] {
    return this.entries.filter(e => e.actorId === actorId);
  }

  getRecent(limit = 100): AuditLogEntry[] {
    return this.entries.slice(-limit).reverse();
  }

  clear(): void {
    this.entries = [];
  }
}

export const auditLog = new AuditLog();
