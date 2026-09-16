/**
 * SolarAudit — Battery Repository: Types
 *
 * The persisted shape of a Battery record.
 *
 * This file imports RESULT and INPUT types from the Battery Engine,
 * but only as type imports — the repository never invokes the engine.
 * It stores what the engine produced as data.
 */

import type {
  BatteryCellSpec,
  BatteryInput,
  BatteryResult,
} from "../../engineering/battery";

export type BatteryRecordStatus =
  | "candidate"
  | "selected"
  | "installed"
  | "archived";

/**
 * A saved battery sizing record.
 *
 * `inputs` is the exact input the Battery Engine received.
 * `result` is the exact output it produced.
 * Together they make the sizing reproducible.
 */
export interface BatteryRecord {
  readonly id: string;
  readonly projectId: string;
  readonly auditId?: string;
  readonly name: string;
  readonly status: BatteryRecordStatus;
  readonly calculationVersion: string;
  readonly cellSpec: BatteryCellSpec;
  readonly inputs: BatteryInput;
  readonly result: BatteryResult;
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
export type CreateBatteryRecordInput = Omit<
  BatteryRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  readonly status?: BatteryRecordStatus;
};

/**
 * What the caller may patch on update. Everything except the id and
 * creation timestamp is mutable.
 */
export type UpdateBatteryRecordPatch = Partial<
  Omit<BatteryRecord, "id" | "createdAt" | "updatedAt">
>;

export interface BatteryListFilter {
  readonly projectId?: string;
  readonly auditId?: string;
  readonly status?: BatteryRecordStatus;
  readonly limit?: number;
}
