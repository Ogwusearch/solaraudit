/**
 * SolarAudit — Report Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * The Report Engine assembles a structured engineering report document
 * from the outputs of every other engine. It does NOT render PDF/HTML.
 * A presentation layer consumes the ReportResult.
 */

export type ReportSectionKey =
  | "cover"
  | "summary"
  | "load"
  | "energy"
  | "solar"
  | "battery"
  | "inverter"
  | "charge-controller"
  | "cable"
  | "protection"
  | "validation"
  | "bom"
  | "costing"
  | "assumptions"
  | "traceability";

export type SectionStatus = "complete" | "partial" | "missing" | "invalid";

export interface ReportEntry {
  readonly label: string;
  readonly value: string | number | boolean;
  readonly unit?: string;
}

export interface ReportSection {
  readonly key: ReportSectionKey;
  readonly title: string;
  readonly order: number;
  readonly status: SectionStatus;
  readonly body: readonly ReportEntry[];
  readonly notes?: readonly string[];
}

export interface ReportMetadata {
  readonly projectName: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly auditorName?: string;
  readonly reportVersion: string;            // e.g. "1.0"
  readonly calculationVersion: string;       // engine version stamp
  readonly generatedAtIso: string;           // caller-supplied ISO date
  readonly currency?: string;
}

export interface ReportAssumption {
  readonly key: string;
  readonly value: string;
  readonly source?: string;                  // e.g. "site survey", "default", "code"
}

export interface TraceEntry {
  readonly engine: string;                   // "load", "solar", ...
  readonly version: string;
  readonly producedAtIso: string;
}

// -------------------- Upstream engine snapshots ----------------------

export interface LoadReportSnapshot {
  readonly totalConnectedKw: number;
  readonly peakDemandKw: number;
  readonly dailyEnergyKwh: number;
  readonly essentialEnergyKwh: number;
}

export interface EnergyReportSnapshot {
  readonly pvGenerationKwh: number;
  readonly selfConsumedKwh: number;
  readonly gridImportKwh: number;
  readonly gridExportKwh: number;
  readonly selfConsumptionRate: number;
  readonly selfSufficiencyRate: number;
}

export interface SolarReportSnapshot {
  readonly designArrayKwp: number;
  readonly totalPanels: number;
  readonly seriesPanels: number;
  readonly parallelStrings: number;
  readonly arrayVoc: number;
}

export interface BatteryReportSnapshot {
  readonly bankVoltage: number;
  readonly bankCapacityAh: number;
  readonly installedKwh: number;
  readonly totalCells: number;
  readonly seriesCells: number;
  readonly parallelStrings: number;
}

export interface InverterReportSnapshot {
  readonly recommendedVa: number;
  readonly dcInputCurrentA: number;
  readonly outputVoltage: number;
  readonly outputFrequency: number;
}

export interface ChargeControllerReportSnapshot {
  readonly technology: "mppt" | "pwm";
  readonly recommendedCurrentA: number;
  readonly maxPvInputVoltage?: number;
}

export interface CableReportSnapshot {
  readonly role: string;
  readonly selectedAreaMm2: number;
  readonly actualDropPercent: number;
  readonly lengthM: number;
}

export interface ProtectionReportSnapshot {
  readonly role: string;
  readonly technology: string;
  readonly selectedRatingA: number;
  readonly minimumVoltageRatingV: number;
}

export interface BomReportSnapshot {
  readonly itemCount: number;
  readonly totalQuantity: number;
  readonly categories: readonly string[];
}

export interface CostingReportSnapshot {
  readonly materialSubtotal: number;
  readonly overheadsSubtotal: number;
  readonly grandTotal: number;
  readonly currency: string;
}

export interface ValidationReportSnapshot {
  readonly overallStatus: "valid" | "warning" | "invalid";
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
}

export interface ReportInput {
  readonly metadata: ReportMetadata;
  readonly assumptions?: readonly ReportAssumption[];
  readonly trace?: readonly TraceEntry[];

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
}

// --------------------------- Output ----------------------------------

export interface ReportSummary {
  readonly dailyEnergyKwh?: number;
  readonly arrayKwp?: number;
  readonly batteryInstalledKwh?: number;
  readonly inverterVa?: number;
  readonly grandTotal?: number;
  readonly currency?: string;
}

export interface ReportResult {
  readonly title: string;
  readonly metadata: ReportMetadata;
  readonly summary: ReportSummary;
  readonly sections: readonly ReportSection[];
  readonly sectionCount: number;
  readonly overallStatus: "complete" | "partial" | "invalid";
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
