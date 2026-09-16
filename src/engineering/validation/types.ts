/**
 * SolarAudit — Validation Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * This engine validates a WHOLE SYSTEM configuration, not a single
 * input object. Each component is optional: the engine runs whichever
 * cross-cutting rules have enough information to fire.
 */

export type Severity = "error" | "warning" | "info";

export type RuleCode =
  | "VOLTAGE_BATTERY_INVERTER_MATCH"
  | "VOLTAGE_BATTERY_CONTROLLER_MATCH"
  | "PV_VOC_WITHIN_CONTROLLER"
  | "PV_ISC_WITHIN_CONTROLLER"
  | "CONTROLLER_OUTPUT_WITHIN_BATTERY_CHARGE_LIMIT"
  | "PV_ENERGY_MEETS_DAILY_REQUIREMENT"
  | "INVERTER_PEAK_WITHIN_BATTERY_DISCHARGE"
  | "CABLE_AMPACITY_SUFFICIENT"
  | "CABLE_VOLTAGE_DROP_WITHIN_TARGET"
  | "PROTECTION_CURRENT_SUFFICIENT"
  | "PROTECTION_VOLTAGE_SUFFICIENT"
  | "PROTECTION_INTERRUPT_SUFFICIENT"
  | "SYSTEM_VOLTAGES_CONSISTENT"
  | "PV_ARRAY_POWER_MATCHES_BATTERY_C_RATE";

export interface RuleResult {
  readonly code: RuleCode;
  readonly severity: Severity;
  readonly passed: boolean;
  readonly message: string;
  readonly details?: Readonly<Record<string, number | string | boolean>>;
}

// ----------------------- Component snapshots -------------------------

export interface PvSnapshot {
  readonly arrayKwp: number;
  readonly arrayVoc: number;
  readonly arrayIsc: number;
  readonly arrayImp: number;
  readonly dailyGenerationKwh: number;   // from Solar Engine (with PSH)
}

export interface BatterySnapshot {
  readonly bankVoltage: number;
  readonly bankCapacityAh: number;
  readonly installedKwh: number;
  readonly maxChargeCurrentA: number;
  readonly maxDischargeCurrentA: number;
}

export interface InverterSnapshot {
  readonly systemVoltage: number;
  readonly recommendedVa: number;
  readonly continuousLoadW: number;
  readonly peakLoadW: number;
  readonly surgeLoadW: number;
  readonly dcInputCurrentA: number;
  readonly dcSurgeCurrentA: number;
}

export interface ChargeControllerSnapshot {
  readonly technology: "mppt" | "pwm";
  readonly batteryVoltage: number;
  readonly recommendedCurrentA: number;
  readonly maxPvInputVoltage?: number;
  readonly maxPvInputCurrentA?: number;
  readonly maxOutputCurrentA?: number;
}

export interface CableSnapshot {
  readonly role: string;                 // e.g. "battery", "pv-string", "inverter-dc"
  readonly currentA: number;
  readonly deratedAmpacityA: number;
  readonly actualDropPercent: number;
  readonly targetDropPercent?: number;
}

export interface ProtectionSnapshot {
  readonly role: string;
  readonly selectedRatingA: number;
  readonly designCurrentA: number;
  readonly selectedVoltageRatingV?: number;
  readonly minimumVoltageRatingV: number;
  readonly selectedInterruptRatingKa?: number;
  readonly availableFaultCurrentKa?: number;
}

export interface SystemConfiguration {
  readonly dailyEnergyRequirementKwh: number;
  readonly pv?: PvSnapshot;
  readonly battery?: BatterySnapshot;
  readonly inverter?: InverterSnapshot;
  readonly chargeController?: ChargeControllerSnapshot;
  readonly cables?: readonly CableSnapshot[];
  readonly protections?: readonly ProtectionSnapshot[];
}

export interface ValidationInput {
  readonly config: SystemConfiguration;
  readonly skipRules?: readonly RuleCode[];   // explicit rule suppression
}

export interface ValidationResult {
  readonly overallStatus: "valid" | "warning" | "invalid";
  readonly passedRules: readonly RuleResult[];
  readonly failedRules: readonly RuleResult[];
  readonly warningRules: readonly RuleResult[];
  readonly infoRules: readonly RuleResult[];
  readonly allRules: readonly RuleResult[];
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly warnings: readonly string[];  // engine-level (structural) warnings
  readonly errors: readonly string[];    // engine-level (structural) errors
  readonly isValid: boolean;             // false when structural validation fails
}
