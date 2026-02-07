// src/shared/audit/AuditTrail.ts
import { AuditEvent } from "./AuditEvent";

export interface AuditTrail {
  record(event: AuditEvent): Promise<void>;
}
