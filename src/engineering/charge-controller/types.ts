/**
 * SolarAudit — Charge Controller Engine: Types
 *
 * Pure data definitions.
 * No logic.
 * No imports from siblings.
 */

export type ControllerTechnology =
  | "mppt"
  | "pwm";

export interface ChargeControllerInput {
  /** Total PV array power from Solar Engine. */
  readonly pvArrayKwp: number;

  /** PV array voltage at maximum power. */
  readonly pvVmp: number;

  /** PV array open-circuit voltage. */
  readonly pvVoc: number;

  /** PV array current at maximum power. */
  readonly pvImp: number;

  /** PV array short-circuit current. */
  readonly pvIsc: number;

  /** Nominal battery-bank voltage. */
  readonly batteryVoltage: number;

  /** Battery-bank capacity in Ah. */
  readonly batteryCapacityAh: number;

  /** Charge-controller technology. */
  readonly technology: ControllerTechnology;

  /** Additional controller design margin. */
  readonly designMargin: number;

  /** Controller conversion efficiency, 0..1. */
  readonly controllerEfficiency: number;

  /** Maximum PV input voltage supported by controller. */
  readonly maxPvInputVoltage?: number;

  /** Maximum PV input current supported by controller. */
  readonly maxPvInputCurrentA?: number;

  /** Maximum battery-side charging current supported by controller. */
  readonly maxOutputCurrentA?: number;
}

export interface ChargeControllerResult {
  /** Required charging current before design margin. */
  readonly requiredChargeCurrentA: number;

  /** Required charging current after design margin. */
  readonly designChargeCurrentA: number;

  /** Minimum controller rating required. */
  readonly minControllerCurrentA: number;

  /** Recommended controller rating. */
  readonly recommendedControllerCurrentA: number;

  /** Whether PV voltage is compatible with the controller. */
  readonly pvVoltageCompatible: boolean;

  /** Whether PV current is compatible with the controller. */
  readonly pvCurrentCompatible: boolean;

  /** Whether controller output current is sufficient. */
  readonly outputCurrentCompatible: boolean;

  /**
   * Matching standard controller rating.
   *
   * null means the required current exceeds
   * the available standard controller ratings.
   */
  readonly recommendedStandardA: number | null;

  readonly technology: ControllerTechnology;

  readonly warnings: readonly string[];

  readonly errors: readonly string[];

  readonly isValid: boolean;
}