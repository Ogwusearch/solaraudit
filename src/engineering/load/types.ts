/**
 * SolarAudit — Load Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export interface Appliance {
  readonly name: string;
  readonly powerWatts: number;   // rated power per unit
  readonly hoursPerDay: number;  // average daily usage hours (0..24)
  readonly quantity: number;     // number of identical units (>=1)
}

export interface LoadInput {
  readonly appliances: readonly Appliance[];
  readonly diversityFactor?: number; // 0..1, default 1.0
  readonly safetyMargin?: number;    // fraction added, default 0.0
}

export interface LoadResult {
  readonly totalDailyEnergyKwh: number;
  readonly peakLoadKw: number;
  readonly loadFactor: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
