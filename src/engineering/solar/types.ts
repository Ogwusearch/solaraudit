
/**
 * SolarAudit — Solar Engine: Types
 *
 * Pure data definitions.
 * No calculation logic.
 * No imports from sibling modules.
 */

// -----------------------------------------------------------------------------
// PV Panel Specification
// -----------------------------------------------------------------------------

export interface PanelSpec {
  /**
   * Manufacturer/model name.
   */
  readonly name: string;

  /**
   * Rated panel power at STC.
   *
   * Unit: watts (W)
   */
  readonly ratedPowerWatts: number;

  /**
   * Voltage at maximum power.
   *
   * Unit: volts (V)
   */
  readonly vmp: number;

  /**
   * Current at maximum power.
   *
   * Unit: amperes (A)
   */
  readonly imp: number;

  /**
   * Open-circuit voltage.
   *
   * Unit: volts (V)
   */
  readonly voc: number;

  /**
   * Short-circuit current.
   *
   * Unit: amperes (A)
   */
  readonly isc: number;
}

// -----------------------------------------------------------------------------
// Solar Calculation Input
// -----------------------------------------------------------------------------

export interface SolarInput {
  /**
   * Required daily energy from the Energy Engine.
   *
   * Unit: kWh/day
   */
  readonly dailyEnergyKwh: number;

  /**
   * Site peak sun hours.
   *
   * Expected range: 0–24 hours/day
   */
  readonly peakSunHours: number;

  /**
   * Overall PV system efficiency.
   *
   * Fraction:
   *
   *   0.80 = 80%
   *
   * Includes losses such as:
   * - wiring
   * - inverter
   * - soiling
   * - temperature
   * - mismatch
   * - other system derating
   */
  readonly systemEfficiency: number;

  /**
   * Additional PV design margin.
   *
   * Fraction:
   *
   *   0.25 = 25%
   */
  readonly designMargin: number;

  /**
   * PV panel electrical specification.
   */
  readonly panel: PanelSpec;

  // ---------------------------------------------------------------------------
  // Array Configuration Constraints
  // ---------------------------------------------------------------------------

  /**
   * Maximum number of panels permitted in one series string.
   */
  readonly maxSeriesPanels?: number;

  /**
   * Maximum number of parallel strings permitted.
   */
  readonly maxParallelStrings?: number;

  // ---------------------------------------------------------------------------
  // Electrical Compatibility Constraints
  // ---------------------------------------------------------------------------

  /**
   * Maximum permitted PV array open-circuit voltage.
   *
   * Unit: volts (V)
   *
   * Typically supplied by:
   * - inverter
   * - MPPT charge controller
   * - DC input stage
   */
  readonly maxArrayVoc?: number;

  /**
   * Minimum required PV array operating voltage.
   *
   * Unit: volts (V)
   *
   * Typically corresponds to the minimum MPPT operating voltage.
   */
  readonly minArrayVmp?: number;
}

// -----------------------------------------------------------------------------
// Solar Calculation Result
// -----------------------------------------------------------------------------

export interface SolarResult {
  /**
   * Required PV array power before design margin.
   *
   * Unit: kWp
   */
  readonly requiredArrayKwp: number;

  /**
   * Required PV array power after design margin.
   *
   * Unit: kWp
   */
  readonly designArrayKwp: number;

  /**
   * Total number of installed panels.
   */
  readonly totalPanels: number;

  /**
   * Number of panels connected in series per string.
   */
  readonly seriesPanels: number;

  /**
   * Number of parallel PV strings.
   */
  readonly parallelStrings: number;

  /**
   * Actual installed PV array capacity.
   *
   * Unit: kWp
   *
   * Based on the actual number of complete panels selected.
   */
  readonly actualArrayKwp: number;

  /**
   * Array operating voltage at maximum power.
   *
   * Calculation:
   *
   *   panel Vmp × series panels
   *
   * Parallel strings do not increase array Vmp.
   *
   * Unit: volts (V)
   */
  readonly arrayVmp: number;

  /**
   * Array operating current at maximum power.
   *
   * Calculation:
   *
   *   panel Imp × parallel strings
   *
   * Unit: amperes (A)
   */
  readonly arrayImp: number;

  /**
   * Array open-circuit voltage.
   *
   * Calculation:
   *
   *   panel Voc × series panels
   *
   * Note:
   * Future versions should apply cold-temperature Voc correction.
   *
   * Unit: volts (V)
   */
  readonly arrayVoc: number;

  /**
   * Array short-circuit current.
   *
   * Calculation:
   *
   *   panel Isc × parallel strings
   *
   * Unit: amperes (A)
   */
  readonly arrayIsc: number;

  /**
   * Engineering warnings.
   *
   * Warnings do not necessarily invalidate the calculation.
   */
  readonly warnings: readonly string[];

  /**
   * Calculation errors.
   *
   * Errors indicate that a valid engineering result could not be produced.
   */
  readonly errors: readonly string[];

  /**
   * Indicates whether the calculation result is valid.
   */
  readonly isValid: boolean;
}