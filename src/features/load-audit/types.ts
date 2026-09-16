/**
 * SolarAudit — Load Audit feature: Types
 *
 * Feature-local view models. These are the shapes the UI binds to.
 * They map to/from the engineering engine's types via the service layer.
 *
 * IMPORTANT: no engineering formula lives here. These are pure shapes.
 */

import type { Appliance, LoadInput, LoadResult } from "../../engineering/load";

/**
 * A single row in the load audit table, as the user edits it.
 * All fields are strings to bind naturally to form inputs; the service
 * layer parses them before calling the engine.
 */
export interface ApplianceRowDraft {
  readonly id: string;
  readonly name: string;
  readonly powerWatts: string;      // user-typed, e.g. "120"
  readonly hoursPerDay: string;     // user-typed, e.g. "5"
  readonly quantity: string;        // user-typed, e.g. "1"
  readonly essential: boolean;
}

export interface LoadAuditFormDraft {
  readonly appliances: readonly ApplianceRowDraft[];
  readonly diversityFactor: string; // user-typed, e.g. "0.8"
  readonly safetyMargin: string;    // user-typed, e.g. "0.1"
}

/**
 * Feature-level parsed input — passed to the service layer. The service
 * layer is responsible for parsing the draft into a `LoadInput`.
 */
export interface LoadAuditParsedInput {
  readonly appliances: readonly Appliance[];
  readonly diversityFactor: number;
  readonly safetyMargin: number;
}

/**
 * What the UI shows after a successful calculation. Wraps the engine
 * result with feature-level presentation metadata.
 */
export interface LoadAuditView {
  readonly result: LoadResult;
  readonly calculatedAt: string;    // ISO timestamp
}

/**
 * Form-level validation errors — field-keyed, ready for inline display.
 * Distinct from engine errors, which describe engineering problems.
 */
export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type LoadAuditStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
