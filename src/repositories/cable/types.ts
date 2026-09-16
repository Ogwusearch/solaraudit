/**
 * SolarAudit — Cable Repository: Types
 *
 * The persisted shape of a Cable record.
 *
 * This file imports RESULT and INPUT types from the Cable Engine, but
 * only as type imports — the repository never invokes the engine. It
 * stores what the engine produced as data.
 */

import type {
  CableInput,
  CableResult,
  CircuitType,
  ConductorMaterial,
  InstallationMethod,
} from "../../engineering/cable";
import type { CircuitRole } from "../../engineering/protection";

export type CableRecordStatus =
  | "candidate"
  | "selected"
  | "installed"
  | "archived";

/**
 * A saved cable sizing record for ONE circuit run.
 *
 * `inputs` is the exact input the Cable Engine received.
 * `result` is the exact output it produced.
 * Together they make the sizing reproducible.
 *
 * `circuitRole` identifies which run this record sizes — battery
 * main, PV string 1, inverter AC, etc. Multiple records may share a
 * role (candidates) but only one per (project, circuitRole) may be
 * "selected".
 */
export interface CableRecord {
  readonly id: string;
  readonly projectId: string;
  readonly auditId?: string;

  /** Human-readable label, e.g. "Battery main", "PV string 1". */
  readonly label: string;
  readonly circuitRole: CircuitRole;

  /** Denormalised for filter speed; also present in inputs. */
  readonly circuitType: CircuitType;
  readonly material: ConductorMaterial;
  readonly installationMethod: InstallationMethod;

  readonly status: CableRecordStatus;
  readonly calculationVersion: string;

  readonly inputs: CableInput;
  readonly result: CableResult;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];

  readonly createdAt: string;
  readonly updatedAt: string;
  readonly notes?: string;
}

/**
 * What the caller supplies on create. The repository stamps id,
 * timestamps, and default status.
 */
export type CreateCableRecordInput = Omit<
  CableRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  readonly status?: CableRecordStatus;
};

/**
 * What the caller may patch on update. Everything except the id and
 * creation timestamp is mutable.
 */
export type UpdateCableRecordPatch = Partial<
  Omit<CableRecord, "id" | "createdAt" | "updatedAt">
>;

export interface CableListFilter {
  readonly projectId?: string;
  readonly auditId?: string;
  readonly circuitRole?: CircuitRole;
  readonly status?: CableRecordStatus;
  readonly limit?: number;
}
