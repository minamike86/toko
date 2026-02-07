// src/shared/audit/AuditEvent.ts
export type AuditEvent = {
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
};
