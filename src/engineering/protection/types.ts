
/**
 * SolarAudit — Protection Engine: Types
 *
 * Pure data definitions.
 * No logic.
 * No imports from siblings.
 *
 * The engine is called once per circuit.
 * The caller assembles a complete protection scheme by
 * calling it for each protected circuit/run.
 */

export type ProtectionTechnology =
  | "fuse"
  | "mcb"
  | "mccb"
  | "dc-breaker"
  | "dc-isolator"
  | "spd"
  | "rcd";

export type CircuitRole =
  | "battery"
  | "pv-string"
  | "pv-array"
  | "charge-controller"
  | "inverter-dc"
  | "inverter-ac"
  | "ac-load"
  | "ac-grid";

export type VoltageType =
  | "dc"
  | "ac";

export interface ProtectionInput {
  readonly role: CircuitRole;
  readonly voltageType: VoltageType;
  readonly technology: ProtectionTechnology;

  /**
   * Continuous operating current of the protected circuit.
   */
  readonly continuousCurrentA: number;

  /**
   * Nominal circuit/system voltage.
   */
  readonly systemVoltageV: number;

  /**
   * Protection design multiplier.
   * When omitted, the role-specific default is used.
   */
  readonly safetyFactor?: number;

  /**
   * Available fault current at the protection-device location.
   * Used to determine the minimum interrupt rating.
   */
  readonly availableFaultCurrentKa?: number;

  /**
   * Optional candidate device specifications.
   * Used for compatibility checks.
   */
  readonly deviceVoltageRatingV?: number;
  readonly deviceInterruptRatingKa?: number;
  readonly deviceCurrentRatingA?: number;
}

export interface ProtectionResult {
  readonly role: CircuitRole;
  readonly technology: ProtectionTechnology;

  /**
   * Continuous current × safety factor.
   */
  readonly designCurrentA: number;

  /**
   * Next available standard protection rating
   * greater than or equal to design current.
   */
  readonly recommendedRatingA: number;

  /**
   * Minimum required device voltage rating
   * after the configured DC voltage margin.
   */
  readonly minimumVoltageRatingV: number;

  /**
   * Minimum interrupt rating required by the
   * available fault current.
   *
   * Zero means no fault-current value was supplied
   * in the current model.
   */
  readonly minimumInterruptRatingKa: number;

  /**
   * Candidate device voltage compatibility.
   */
  readonly voltageCompatible: boolean;

  /**
   * Candidate device interrupt-rating compatibility.
   */
  readonly interruptCompatible: boolean;

  /**
   * Candidate device current rating is sufficient
   * for the calculated design current.
   */
  readonly currentRatingSufficient: boolean;

  /**
   * Compatible candidate device rating when supplied;
   * otherwise the calculated recommended rating.
   */
  readonly selectedRatingA: number;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
