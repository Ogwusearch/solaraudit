
/**
 * SolarAudit — Protection Engine: Error & Warning Messages
 */

// ---------------------------------------------------------------------------
// Input validation errors
// ---------------------------------------------------------------------------

export const ERROR_INVALID_CURRENT =
  "continuousCurrentA must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltageV must be > 0.";

export const ERROR_INVALID_VOLTAGE_TYPE =
  "voltageType must be 'dc' or 'ac'.";

export const ERROR_INVALID_ROLE =
  "role is not a recognised circuit role.";

export const ERROR_INVALID_TECHNOLOGY =
  "technology is not a recognised protection technology.";

export const ERROR_INVALID_SAFETY_FACTOR =
  "safetyFactor must be >= 1.0 when provided.";

export const ERROR_INVALID_FAULT_CURRENT =
  "availableFaultCurrentKa must be >= 0 when provided.";

export const ERROR_INVALID_DEVICE_VOLTAGE =
  "deviceVoltageRatingV must be > 0 when provided.";

export const ERROR_INVALID_DEVICE_INTERRUPT =
  "deviceInterruptRatingKa must be > 0 when provided.";

export const ERROR_INVALID_DEVICE_CURRENT =
  "deviceCurrentRatingA must be > 0 when provided.";

// ---------------------------------------------------------------------------
// Calculation errors
// ---------------------------------------------------------------------------

export const ERROR_NO_STANDARD_RATING =
  "No standard protection rating is large enough for the calculated design current.";

// ---------------------------------------------------------------------------
// Device compatibility errors
// ---------------------------------------------------------------------------

export const ERROR_DEVICE_VOLTAGE_TOO_LOW = (
  need: number,
  got: number,
): string =>
  `Device voltage rating (${got} V) is below the required minimum (${need} V).`;

export const ERROR_DEVICE_INTERRUPT_TOO_LOW = (
  need: number,
  got: number,
): string =>
  `Device interrupt rating (${got} kA) is below the available fault current (${need} kA).`;

export const ERROR_DEVICE_CURRENT_TOO_LOW = (
  need: number,
  got: number,
): string =>
  `Device current rating (${got} A) is below the design current (${need} A).`;

// ---------------------------------------------------------------------------
// Engineering warnings
// ---------------------------------------------------------------------------

export const WARN_HIGH_SAFETY_FACTOR = (
  value: number,
): string =>
  `Safety factor is high (${value}). Verify sizing basis.`;

export const WARN_HIGH_FAULT_CURRENT = (
  value: number,
): string =>
  `Available fault current is high (${value} kA). Select devices with adequate interrupt rating.`;

export const WARN_VERY_HIGH_FAULT_CURRENT = (
  value: number,
): string =>
  `Fault current (${value} kA) is very high; a protection coordination study is recommended.`;

export const WARN_HIGH_CURRENT_MCB = (
  value: number,
): string =>
  `Circuit current is high (${value} A). Review whether an MCCB, fuse, or another appropriately rated device is more suitable than an MCB.`;

export const WARN_DC_BREAKER_ARC =
  "DC circuits require appropriately DC-rated switching/protection devices; AC-only devices must not be used.";

export const WARN_SPD_SEPARATE_ENGINE =
  "SPD sizing uses surge-current ratings (kA, 8/20 µs), not continuous current. Treat this result as informational; a dedicated SPD engine is planned.";

export const WARN_ISOLATOR_NOT_PROTECTION =
  "DC isolators provide disconnection, not over-current protection. Pair with a fuse or DC breaker where over-current protection is required.";

export const WARN_RCD_REQUIRES_OVERCURRENT =
  "RCDs provide earth-leakage protection, not over-current protection. Coordinate with appropriate over-current protection.";

export const WARN_NO_FAULT_CURRENT =
  "Available fault current not provided; interrupt rating cannot be verified.";
