/**
 * SolarAudit — Cable Engine: Types
 *
 * Pure data definitions.
 * No calculation logic.
 * No imports from sibling modules.
 */

export type ConductorMaterial =
  | "copper"
  | "aluminium";

export type CircuitType =
  | "dc"
  | "ac-single-phase"
  | "ac-three-phase";

export type InstallationMethod =
  | "conduit"
  | "cable-tray"
  | "buried"
  | "free-air"
  | "enclosed";

export interface CableInput {
  /** Operating/design current before the optional design margin. */
  readonly currentA: number;

  /** One-way cable run length in metres. */
  readonly lengthM: number;

  /** Nominal system voltage in volts. */
  readonly systemVoltage: number;

  /** Maximum permitted voltage drop as a percentage. */
  readonly allowableDropPercent: number;

  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly installationMethod: InstallationMethod;

  /** Ambient temperature. Defaults to 30 °C. */
  readonly ambientTemperatureC?: number;

  /**
   * Conductor operating temperature used for resistance correction.
   * Typical defaults:
   *   PVC  = 70 °C
   *   XLPE = 90 °C
   */
  readonly conductorTempC?: number;

  /** Number of grouped circuits. Defaults to 1. */
  readonly groupingCount?: number;

  /** Additional design margin as a fraction. Defaults to 0.0. */
  readonly designMargin?: number;
}

export interface CableResult {
  /** Current after applying the design margin. */
  readonly designCurrentA: number;

  /** Maximum permitted voltage drop in volts. */
  readonly maxVoltageDropV: number;

  /** Minimum conductor area required by voltage-drop calculation. */
  readonly calculatedAreaMm2: number;

  /** Minimum conductor area required by ampacity. */
  readonly ampacityAreaMm2: number;

  /** Maximum of voltage-drop and ampacity requirements. */
  readonly requiredAreaMm2: number;

  /** Selected standard conductor size. */
  readonly selectedAreaMm2: number;

  /** Actual voltage drop using the selected conductor. */
  readonly actualVoltageDropV: number;

  /** Actual voltage drop as a percentage of system voltage. */
  readonly actualDropPercent: number;

  /** Conductor resistance in Ω/km at operating temperature. */
  readonly resistanceOhmPerKm: number;

  /** Ambient-temperature correction factor. */
  readonly temperatureFactor: number;

  /** Circuit-grouping correction factor. */
  readonly groupingFactor: number;

  /** Derated current-carrying capacity of the selected conductor. */
  readonly deratedAmpacityA: number;

  /** Whether the selected conductor satisfies the ampacity requirement. */
  readonly ampacityCompatible: boolean;

  /** Whether the selected conductor satisfies the voltage-drop requirement. */
  readonly voltageDropCompatible: boolean;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];

  /** True only when there are no calculation/validation errors. */
  readonly isValid: boolean;
}