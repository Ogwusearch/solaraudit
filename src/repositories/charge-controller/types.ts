/**
 * SolarAudit — Charge Controller Repository: Types
 *
 * The persisted shape of a Charge Controller record.
 *
 * This file imports RESULT and INPUT types from the Charge Controller
 * Engine, but only as type imports — the repository never invokes the
 * engine. It stores what the engine produced as data.
 */

import type {
  ChargeControllerInput,
  ChargeControllerResult,
  ControllerTechnology,
} from "../../engineering/charge-controller";

export type ChargeControllerRecordStatus =
  | "candidate"
  | "selected"
  | "installed"
  | "archived";

/**
 * A saved charge controller sizing record.
 *
 * `inputs` is the exact input the Charge Controller Engine received.
 * `result` is the exact output it produced.
 * Together they make the sizing reproducible.
 *
 * `technology` is denormalised from `inputs` so callers can filter
 * without inspecting the input snapshot.
 */
export interface ChargeControllerRecord {
  readonly id: string;
  readonly projectId: string;
  readonly auditId?: string;

  /** Human-readable label, e.g. "80A MPPT for 5 kWp". */
  readonly label: string;
  readonly technology: ControllerTechnology;

  readonly status: ChargeControllerRecordStatus;
  readonly calculationVersion: string;

  readonly inputs: ChargeControllerInput;
  readonly result: ChargeControllerResult;

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
export type CreateChargeControllerRecordInput = Omit<
  ChargeControllerRecord,
  "id" | "createdAt" | "updatedAt"
> & {
  readonly status?: ChargeControllerRecordStatus;
};

/**
 * What the caller may patch on update. Everything except the id and
 * creation timestamp is mutable.
 */
export type UpdateChargeControllerRecordPatch = Partial<
  Omit<ChargeControllerRecord, "id" | "createdAt" | "updatedAt">
>;

export interface ChargeControllerListFilter {
  readonly projectId?: string;
  readonly auditId?: string;
  readonly technology?: ControllerTechnology;
  readonly status?: ChargeControllerRecordStatus;
  readonly limit?: number;
}
