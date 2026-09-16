/**
 * SolarAudit — Battery Engine: Types
 *
 * Pure data definitions.
 * No logic.
 * No imports from siblings.
 */

export type BatteryTechnology =
  | "flooded-lead-acid"
  | "agm"
  | "gel"
  | "lifepo4"
  | "li-ion-nmc";

export interface BatteryCellSpec {
  readonly name: string;
  readonly technology: BatteryTechnology;

  /** Nominal voltage of one battery unit. */
  readonly nominalVoltage: number;

  /** Rated capacity of one battery unit. */
  readonly capacityAh: number;

  /** Maximum usable depth of discharge for the battery. */
  readonly maxDepthOfDischarge: number;

  /** Battery round-trip efficiency. */
  readonly roundTripEfficiency: number;

  /** Optional maximum charge current per battery unit. */
  readonly maxChargeCurrentA?: number;
}

export interface BatteryInput {
  /** Daily energy demand supplied by the Energy/Load Engine. */
  readonly dailyEnergyKwh: number;

  /** Required backup autonomy in days. */
  readonly autonomyDays: number;

  /** Target DC battery-bank voltage. */
  readonly systemVoltage: number;

  /** Additional battery design margin. */
  readonly designMargin: number;

  /** Temperature derating factor, 0..1. */
  readonly temperatureDerating: number;

  /** Design depth of discharge, 0..1. */
  readonly maxDepthOfDischarge: number;

  /** Design round-trip efficiency, 0..1. */
  readonly roundTripEfficiency: number;

  /** Battery unit specification. */
  readonly cell: BatteryCellSpec;

  /** Optional maximum allowed parallel strings. */
  readonly maxParallelStrings?: number;
}

export interface BatteryResult {
  /** Battery capacity required before design margin. */
  readonly requiredCapacityKwh: number;

  /** Required battery capacity after design margin. */
  readonly designCapacityKwh: number;

  /** Number of parallel strings mathematically required. */
  readonly requiredParallelStrings: number;

  /** Total battery units installed. */
  readonly totalCells: number;

  /** Battery units connected in series per string. */
  readonly seriesCells: number;

  /** Battery strings connected in parallel. */
  readonly parallelStrings: number;

  /** Nominal installed battery energy. */
  readonly actualInstalledKwh: number;

  /** Installed energy available after design DoD. */
  readonly actualUsableKwh: number;

  /** Actual nominal bank voltage. */
  readonly bankVoltage: number;

  /** Total bank capacity in Ah. */
  readonly bankCapacityAh: number;

  /** Maximum charge current for the complete bank. */
  readonly maxChargeCurrentA: number;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}