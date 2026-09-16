/**
 * SolarAudit — Reports feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * compiles them into the Report Engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * Reports is a COMPILER feature. It does not size anything. It takes:
 *   1. Metadata the user fills in (version, date, currency, assumptions)
 *   2. A ProjectSnapshot — read-only engine outputs sourced from
 *      project state (load, energy, solar, battery, …)
 * and hands the merge to the Report Engine.
 */

import type {
  BomReportSnapshot,
  BatteryReportSnapshot,
  CableReportSnapshot,
  ChargeControllerReportSnapshot,
  CostingReportSnapshot,
  EnergyReportSnapshot,
  InverterReportSnapshot,
  LoadReportSnapshot,
  ProtectionReportSnapshot,
  ReportResult,
  SolarReportSnapshot,
  TraceEntry,
  ValidationReportSnapshot,
} from "../../engineering/report";

/**
 * The read-only data that comes from project state. In a nested route
 * (e.g. /projects/:id/reports/new) this is fetched from a project state
 * store; in the standalone scaffold it is populated by "Load sample".
 *
 * Every engine's snapshot is optional. Whatever is present becomes a
 * section in the report; whatever is absent becomes a "missing" section
 * with an info-level note from the Report Engine.
 */
export interface ProjectSnapshot {
  readonly load?: LoadReportSnapshot;
  readonly energy?: EnergyReportSnapshot;
  readonly solar?: SolarReportSnapshot;
  readonly battery?: BatteryReportSnapshot;
  readonly inverter?: InverterReportSnapshot;
  readonly chargeController?: ChargeControllerReportSnapshot;
  readonly cables?: readonly CableReportSnapshot[];
  readonly protections?: readonly ProtectionReportSnapshot[];
  readonly bom?: BomReportSnapshot;
  readonly costing?: CostingReportSnapshot;
  readonly validation?: ValidationReportSnapshot;
  readonly trace?: readonly TraceEntry[];
}

/**
 * One row of user-authored assumptions. The engine records both the
 * value and where it came from.
 */
export interface AssumptionDraft {
  readonly id: string;                    // stable UI key
  readonly key: string;
  readonly value: string;
  readonly source: string;                // optional, e.g. "site survey"
}

/**
 * The user-editable part of the report. Everything here is metadata —
 * no engineering values. Engineering data lives in the snapshot.
 */
export interface ReportsFormDraft {
  readonly projectName: string;
  readonly clientName: string;
  readonly siteAddress: string;
  readonly auditorName: string;
  readonly reportVersion: string;
  readonly calculationVersion: string;
  readonly generatedAtIso: string;
  readonly currency: string;
  readonly assumptions: readonly AssumptionDraft[];
}

export interface ReportsView {
  readonly result: ReportResult;
  readonly generatedAt: string;           // wall-clock time of this generation
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type ReportsStatus =
  | "idle"
  | "editing"
  | "generating"
  | "generated"
  | "error";
