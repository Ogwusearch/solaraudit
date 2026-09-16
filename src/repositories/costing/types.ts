/**
 * SolarAudit — Costing Repository: Types
 *
 * The persisted shape of a Costing record.
 *
 * This file imports RESULT and INPUT types from the Costing Engine,
 * but only as type imports — the repository never invokes the engine.
 * It stores what the engine produced as data.
 */

import type {
  CostingInput,
  CostingResult,
} from "../../engineering/costing";

export type CostingRecordStatus =
  | "draft"
  | "selected"
  | "final"
  | "archived";

/**
 * A saved costing record for a project.
 *
 * `inputs` is the exact input the Costing Engine received.
 * `result` is the exact output it produced.
 * Together they make the financial plan reproducible.
 *
 * `currency` is denormalised from `inputs.currency` so callers can
 * filter without inspecting the input snapshot.
 */
export interface CostingRecord {
  readonly id: string;
  readonly projectId: string;
  readonly auditId?: string;

  /** Human-readable label, e.g. "Baseline estimate", "Revised v2". */
  readonly label: string;
  readonly currency: string;

  readonly status: CostingRecordStatus;
  readonly calculationVersion: string;

  readonly inputs: CostingInput;
  readonly result: CostingResult;

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
export type CreateCostingRecordInput = Omit<
  CostingRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  readonly status?: CostingRecordStatus;
};

/**
 * What the caller may patch on update. Everything except the id and
 * creation timestamp is mutable.
 */
export type UpdateCostingRecordPatch = Partial<
  Omit<CostingRecord, "id" | "createdAt" | "updatedAt">
>;

export interface CostingListFilter {
  readonly projectId?: string;
  readonly auditId?: string;
  readonly currency?: string;
  readonly status?: CostingRecordStatus;
  readonly limit?: number;
}
