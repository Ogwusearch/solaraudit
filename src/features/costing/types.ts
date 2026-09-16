/**
 * SolarAudit — Costing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * Costing is strictly financial. It does NOT change any sizing result.
 */

import type {
  CostCategory,
  CostingResult,
} from "../../engineering/costing";

export interface CostLineItemDraft {
  readonly id: string;                    // stable UI key, not sent to engine
  readonly category: CostCategory;
  readonly description: string;
  readonly quantity: string;              // user-typed
  readonly unitCost: string;              // user-typed
  readonly unit: string;                  // optional, e.g. "pcs", "m"
}

export interface OverheadsDraft {
  readonly installationPercent: string;
  readonly transportPercent: string;
  readonly engineeringPercent: string;
  readonly contingencyPercent: string;
}

export interface CostingFormDraft {
  readonly currency: string;              // ISO 4217
  readonly items: readonly CostLineItemDraft[];

  readonly wasteFactor: string;           // 0..1
  readonly discountPercent: string;       // 0..100
  readonly taxPercent: string;            // 0..100

  readonly overheads: OverheadsDraft;
}

export interface CostingView {
  readonly result: CostingResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type CostingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
