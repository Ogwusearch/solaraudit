
/**
 * SolarAudit — Energy Engine: Types
 *
 * Pure data definitions.
 *
 * Rules:
 *   - No calculation logic
 *   - No validation logic
 *   - No imports from sibling modules
 *   - All values use SI-compatible engineering units
 */

// =============================================================================
// PV ARRAY
// =============================================================================

export interface PVArray {
  /**
   * Engineering identifier for the PV array.
   */
  readonly name: string;

  /**
   * Installed DC PV capacity in kWp.
   */
  readonly capacityKwp: number;

  /**
   * Equivalent peak-sun hours per day.
   */
  readonly peakSunHours: number;

  /**
   * Overall PV performance ratio.
   *
   * Represents losses from factors such as:
   *   - inverter conversion
   *   - temperature
   *   - wiring
   *   - soiling
   *   - mismatch
   *   - other system losses
   *
   * Expected range: 0..1.
   */
  readonly performanceRatio: number;
}

// =============================================================================
// BATTERY
// =============================================================================

export interface Battery {
  /**
   * Engineering identifier for the battery bank.
   */
  readonly name: string;

  /**
   * Nominal battery capacity in kWh.
   *
   * This is the total rated stored energy before
   * applying depth of discharge.
   */
  readonly capacityKwh: number;

  /**
   * Usable fraction of nominal battery capacity.
   *
   * Example:
   *
   *   capacityKwh = 10
   *   depthOfDischarge = 0.9
   *
   *   usable capacity = 9 kWh
   *
   * Expected range: 0..1.
   */
  readonly depthOfDischarge: number;

  /**
   * Battery round-trip efficiency.
   *
   * Represents the fraction of charging energy that
   * can ultimately be recovered after a complete
   * charge/discharge cycle.
   *
   * Expected range: 0..1.
   */
  readonly roundTripEfficiency: number;

  /**
   * Initial battery state of charge.
   *
   * 0 = empty
   * 1 = 100% charged
   *
   * Expected range: 0..1.
   */
  readonly initialSoc: number;
}

// =============================================================================
// ENERGY INPUT
// =============================================================================

export interface EnergyInput {
  /**
   * One or more PV arrays participating in the simulation.
   */
  readonly pvArrays: readonly PVArray[];

  /**
   * Daily electrical energy consumption in kWh/day.
   *
   * Typically supplied by the Load Engine or measured
   * historical consumption data.
   */
  readonly dailyConsumptionKwh: number;

  /**
   * Optional battery storage system.
   */
  readonly battery?: Battery;

  /**
   * Simulation horizon in days.
   *
   * Must be an integer >= 1.
   */
  readonly days: number;
}

// =============================================================================
// ENERGY RESULT
// =============================================================================

export interface EnergyResult {
  /**
   * Total PV energy generated over the simulation horizon.
   */
  readonly pvGenerationKwh: number;

  /**
   * Total electrical consumption over the simulation horizon.
   */
  readonly consumptionKwh: number;

  /**
   * Total energy consumed on-site.
   *
   * Includes:
   *   - direct PV → load
   *   - battery → load
   */
  readonly selfConsumedKwh: number;

  /**
   * Energy imported from the utility grid.
   */
  readonly gridImportKwh: number;

  /**
   * PV energy exported to the utility grid.
   */
  readonly gridExportKwh: number;

  /**
   * PV energy sent into the battery before
   * charging losses.
   */
  readonly batteryChargeKwh: number;

  /**
   * Battery energy delivered to the load
   * after discharge losses.
   */
  readonly batteryDischargeKwh: number;

  /**
   * Battery state of charge at the end of the simulation.
   *
   * Range: 0..1.
   */
  readonly batteryFinalSoc: number;

  /**
   * Equivalent full battery cycles over the
   * simulation horizon.
   */
  readonly batteryCycles: number;

  /**
   * Fraction of PV generation consumed on-site.
   *
   * selfConsumedKwh / pvGenerationKwh
   *
   * Range: 0..1.
   */
  readonly selfConsumptionRate: number;

  /**
   * Fraction of total consumption supplied
   * by PV and battery energy.
   *
   * selfConsumedKwh / consumptionKwh
   *
   * Range: 0..1.
   */
  readonly selfSufficiencyRate: number;

  /**
   * Non-fatal engineering warnings.
   */
  readonly warnings: readonly string[];

  /**
   * Validation or calculation errors.
   */
  readonly errors: readonly string[];

  /**
   * Indicates whether the calculation completed
   * successfully without validation errors.
   */
  readonly isValid: boolean;
}
