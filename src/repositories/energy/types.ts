/**
 * SolarAudit — Energy Repository: Types
 *
 * The persisted shape of an Energy record.
 *
 * This file imports RESULT and INPUT types from the Energy Engine,
 * but only as type imports — the repository never invokes the engine.
 * It stores what the engine produced as data.
 */

import type {
  EnergyInput,
  EnergyResult,
} from "../../engineering/energy";

export type EnergyRecordStatus =
  | "draft"
  | "selected"
  | "archived";

/**
 * A saved energy-analysis scenario.
 *
 * `inputs` is the exact input the Energy Engine received.
 * `result` is the exact output it produced.
 * Together they make the analysis reproducible.
 *
 * `days` and `hasBattery` are denormalised from `inputs` so callers
 * can filter without inspecting the input snapshot.
 */
export interface EnergyRecord {
  readonly id: string;
  readonly projectId: string;
  readonly auditId?: string;

  /** Human-readable label, e.g. "Summer scenario, with battery". */
  readonly label: string;

  /** Simulation horizon in days — denormalised from inputs.days. */
  readonly days: number;

  /** Whether the analysis included a battery — denormalised. */
  readonly hasBattery: boolean;

  readonly status: EnergyRecordStatus;
  readonly calculationVersion: string;

  readonly inputs: EnergyInput;
  readonly result: EnergyResult;

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
export type CreateEnergyRecordInput = Omit<
  EnergyRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  readonly status?: EnergyRecordStatus;
};

/**
 * What the caller may patch on update. Everything except the id and
 * creation timestamp is mutable.
 */
export type UpdateEnergyRecordPatch = Partial<
  Omit<EnergyRecord, "id" | "createdAt" | "updatedAt">
>;

export interface EnergyListFilter {
  readonly projectId?: string;
  readonly auditId?: string;
  readonly status?: EnergyRecordStatus;
  readonly hasBattery?: boolean;
  readonly limit?: number;
}
