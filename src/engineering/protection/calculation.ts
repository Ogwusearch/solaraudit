/**
 * SolarAudit — Protection Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   factor              = safetyFactor ?? ROLE_SAFETY_FACTOR[role]
 *   designCurrentA      = continuousCurrentA × factor
 *   recommendedRatingA  = next standard rating >= designCurrentA
 *   minimumVoltageRatingV =
 *       systemVoltageV × (dc ? DC_VOLTAGE_MARGIN_FACTOR : 1)
 *
 *   minimumInterruptRatingKa =
 *       availableFaultCurrentKa ?? 0
 *
 * Compatibility checks:
 *   voltageCompatible =
 *       deviceVoltageRatingV >= minimumVoltageRatingV
 *
 *   interruptCompatible =
 *       deviceInterruptRatingKa >= availableFaultCurrentKa
 *
 *   currentRatingSufficient =
 *       deviceCurrentRatingA >= designCurrentA
 */

import type {
  ProtectionInput,
  ProtectionResult,
} from "./types";

import {
  ROLE_SAFETY_FACTOR,
  STANDARD_RATINGS_A,
  DC_VOLTAGE_MARGIN_FACTOR,
  HIGH_FAULT_CURRENT_KA,
  VERY_HIGH_FAULT_CURRENT_KA,
  HIGH_SAFETY_FACTOR_THRESHOLD,
  HIGH_CURRENT_THRESHOLD_A,
  ROUND_DECIMALS,
} from "./constants";

import {
  ERROR_NO_STANDARD_RATING,
  ERROR_DEVICE_VOLTAGE_TOO_LOW,
  ERROR_DEVICE_INTERRUPT_TOO_LOW,
  ERROR_DEVICE_CURRENT_TOO_LOW,
  WARN_HIGH_SAFETY_FACTOR,
  WARN_HIGH_FAULT_CURRENT,
  WARN_VERY_HIGH_FAULT_CURRENT,
  WARN_HIGH_CURRENT_MCB,
  WARN_DC_BREAKER_ARC,
  WARN_SPD_SEPARATE_ENGINE,
  WARN_ISOLATOR_NOT_PROTECTION,
  WARN_RCD_REQUIRES_OVERCURRENT,
  WARN_NO_FAULT_CURRENT,
} from "./errors";

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function nextStandardRating(
  currentA: number,
): number | null {
  for (const rating of STANDARD_RATINGS_A) {
    if (rating >= currentA) {
      return rating;
    }
  }

  return null;
}

export function calculateInternal(
  input: ProtectionInput,
): ProtectionResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // -----------------------------------------------------------------------
  // 1. Safety factor and design current
  // -----------------------------------------------------------------------

  const factor =
    input.safetyFactor ??
    ROLE_SAFETY_FACTOR[input.role];

  const designCurrentA =
    input.continuousCurrentA * factor;

  // -----------------------------------------------------------------------
  // 2. Recommended standard protection rating
  // -----------------------------------------------------------------------

  const standardMatch =
    nextStandardRating(designCurrentA);

  const recommendedRatingA =
    standardMatch ?? 0;

  if (standardMatch === null) {
    errors.push(ERROR_NO_STANDARD_RATING);
  }

  // -----------------------------------------------------------------------
  // 3. Minimum voltage rating
  // -----------------------------------------------------------------------

  const voltageMargin =
    input.voltageType === "dc"
      ? DC_VOLTAGE_MARGIN_FACTOR
      : 1;

  const minimumVoltageRatingV =
    input.systemVoltageV * voltageMargin;

  // -----------------------------------------------------------------------
  // 4. Minimum interrupt rating
  // -----------------------------------------------------------------------

  const minimumInterruptRatingKa =
    input.availableFaultCurrentKa ?? 0;

  // -----------------------------------------------------------------------
  // 5. Device compatibility
  // -----------------------------------------------------------------------

  let voltageCompatible = true;
  let interruptCompatible = true;
  let currentRatingSufficient = true;

  const isSpd =
    input.technology === "spd";

  // Voltage
  if (input.deviceVoltageRatingV !== undefined) {
    if (
      input.deviceVoltageRatingV <
      minimumVoltageRatingV
    ) {
      voltageCompatible = false;

      errors.push(
        ERROR_DEVICE_VOLTAGE_TOO_LOW(
          round(minimumVoltageRatingV, 2),
          input.deviceVoltageRatingV,
        ),
      );
    }
  }

  // Interrupt rating
  if (
    input.deviceInterruptRatingKa !== undefined &&
    input.availableFaultCurrentKa !== undefined
  ) {
    if (
      input.deviceInterruptRatingKa <
      input.availableFaultCurrentKa
    ) {
      interruptCompatible = false;

      errors.push(
        ERROR_DEVICE_INTERRUPT_TOO_LOW(
          input.availableFaultCurrentKa,
          input.deviceInterruptRatingKa,
        ),
      );
    }
  }

  // Current rating
  if (
    !isSpd &&
    input.deviceCurrentRatingA !== undefined
  ) {
    if (
      input.deviceCurrentRatingA <
      designCurrentA
    ) {
      currentRatingSufficient = false;

      errors.push(
        ERROR_DEVICE_CURRENT_TOO_LOW(
          round(designCurrentA, 2),
          input.deviceCurrentRatingA,
        ),
      );
    }
  }

  // -----------------------------------------------------------------------
  // 6. Selected rating
  // -----------------------------------------------------------------------

  const deviceCurrentCompatible =
    input.deviceCurrentRatingA === undefined ||
    input.deviceCurrentRatingA >= designCurrentA;

  const selectedRatingA =
    !isSpd &&
    input.deviceCurrentRatingA !== undefined &&
    deviceCurrentCompatible
      ? input.deviceCurrentRatingA
      : recommendedRatingA;

  // -----------------------------------------------------------------------
  // 7. Warnings
  // -----------------------------------------------------------------------

  if (
    factor >
    HIGH_SAFETY_FACTOR_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_SAFETY_FACTOR(factor),
    );
  }

  if (
    input.availableFaultCurrentKa !== undefined
  ) {
    if (
      input.availableFaultCurrentKa >=
      VERY_HIGH_FAULT_CURRENT_KA
    ) {
      warnings.push(
        WARN_VERY_HIGH_FAULT_CURRENT(
          input.availableFaultCurrentKa,
        ),
      );
    } else if (
      input.availableFaultCurrentKa >=
      HIGH_FAULT_CURRENT_KA
    ) {
      warnings.push(
        WARN_HIGH_FAULT_CURRENT(
          input.availableFaultCurrentKa,
        ),
      );
    }
  } else {
    warnings.push(WARN_NO_FAULT_CURRENT);
  }

  if (
    input.technology === "mcb" &&
    designCurrentA > HIGH_CURRENT_THRESHOLD_A
  ) {
    warnings.push(
      WARN_HIGH_CURRENT_MCB(
        round(designCurrentA, 1),
      ),
    );
  }

  if (
    input.voltageType === "dc" &&
    input.technology === "mcb"
  ) {
    warnings.push(WARN_DC_BREAKER_ARC);
  }

  if (
    input.technology === "spd"
  ) {
    warnings.push(WARN_SPD_SEPARATE_ENGINE);
  }

  if (
    input.technology === "dc-isolator"
  ) {
    warnings.push(WARN_ISOLATOR_NOT_PROTECTION);
  }

  if (
    input.technology === "rcd"
  ) {
    warnings.push(WARN_RCD_REQUIRES_OVERCURRENT);
  }

  // -----------------------------------------------------------------------
  // 8. Final validity
  // -----------------------------------------------------------------------

  const isValid =
    errors.length === 0;

  return {
    role: input.role,
    technology: input.technology,

    designCurrentA:
      round(designCurrentA),

    recommendedRatingA:
      round(recommendedRatingA),

    minimumVoltageRatingV:
      round(minimumVoltageRatingV),

    minimumInterruptRatingKa:
      round(minimumInterruptRatingKa),

    voltageCompatible,
    interruptCompatible,
    currentRatingSufficient,

    selectedRatingA:
      round(selectedRatingA),

    warnings,
    errors,
    isValid,
  };
}