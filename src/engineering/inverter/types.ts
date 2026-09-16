/**
 * SolarAudit — Inverter Engine: Types
 *
 * Pure data definitions.
 * No calculation logic.
 * No imports from sibling modules.
 */

export type InverterType =
  | "pure-sine"
  | "modified-sine";

export type InverterTopology =
  | "off-grid"
  | "grid-tied"
  | "hybrid";

export interface InverterInput {
  /**
   * Sustained running load.
   */
  readonly continuousLoadW: number;

  /**
   * Short-duration operating peak.
   * Must be >= continuousLoadW.
   */
  readonly peakLoadW: number;

  /**
   * Motor-start / inrush requirement.
   * Must be >= peakLoadW.
   */
  readonly surgeLoadW: number;

  /**
   * Nominal DC battery / DC bus voltage.
   * Typical values: 12 / 24 / 48 V.
   */
  readonly systemVoltage: number;

  /**
   * AC output voltage.
   * Typical values: 120 / 230 / 240 V.
   */
  readonly outputVoltage: number;

  /**
   * AC output frequency.
   * Typical values: 50 / 60 Hz.
   */
  readonly outputFrequency: number;

  /**
   * Load power factor.
   * Range: 0..1.
   */
  readonly powerFactor: number;

  /**
   * Additional inverter sizing margin.
   *
   * Example:
   * 0.25 = 25%
   */
  readonly designMargin: number;

  /**
   * Inverter DC-to-AC efficiency.
   * Range: 0..1.
   */
  readonly inverterEfficiency: number;

  /**
   * Duration of the surge event.
   * Informational only.
   */
  readonly surgeDurationSec?: number;

  readonly type?: InverterType;

  readonly topology?: InverterTopology;

  /**
   * Optional maximum allowable DC input current.
   */
  readonly maxDcInputCurrentA?: number;
}

export interface InverterResult {
  /**
   * Continuous apparent power requirement.
   */
  readonly continuousVa: number;

  /**
   * Peak apparent power requirement.
   */
  readonly peakVa: number;

  /**
   * Surge apparent power requirement.
   */
  readonly surgeVa: number;

  /**
   * Peak inverter VA requirement including
   * design margin.
   */
  readonly minInverterVa: number;

  /**
   * Final recommended inverter capacity.
   *
   * Uses the next standard size when available.
   * Otherwise uses the calculated sizing requirement.
   */
  readonly recommendedInverterVa: number;

  /**
   * Required surge capacity including
   * design margin.
   */
  readonly requiredSurgeVa: number;

  /**
   * Estimated DC current at peak load.
   */
  readonly dcInputCurrentA: number;

  /**
   * Estimated DC current during surge.
   */
  readonly dcSurgeCurrentA: number;

  /**
   * Matching standard inverter size.
   *
   * null means the calculated requirement
   * exceeds the largest configured standard size.
   */
  readonly recommendedStandardVa: number | null;

  readonly warnings: readonly string[];

  readonly errors: readonly string[];

  readonly isValid: boolean;
}