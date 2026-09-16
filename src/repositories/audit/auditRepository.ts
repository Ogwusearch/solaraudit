/**
 * SolarAudit — Audit Repository: Interface
 */

import type {
  Audit,
  AuditListFilter,
  CreateAuditInput,
  UpdateAuditPatch,
} from "./types";

export interface AuditRepository {
  list(filter?: AuditListFilter): Promise<readonly Audit[]>;
  get(id: string): Promise<Audit | null>;
  create(input: CreateAuditInput): Promise<Audit>;
  update(id: string, patch: UpdateAuditPatch): Promise<Audit | null>;
  remove(id: string): Promise<boolean>;
  supersede(id: string, byAuditId: string): Promise<Audit | null>;
}
