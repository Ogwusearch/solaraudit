/**
 * SolarAudit — Protection Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 *
 * NOTE: This engine has TWO layers of validation:
 *   1. Structural (missing/invalid fields) — engine's validateInput.
 *   2. Electrical compatibility (device voltage / interrupt / current
 *      ratings) — checked during calculation, so isValid:false can come
 *      from there too. The service preserves both.
 */

import { calculateProtection } from "../../../engineering/protection";
import type {
  ProtectionInput,
  ProtectionResult,
} from "../../../engineering/protection";
import type {
  FormValidationErrors,
  ProtectionSizingFormDraft,
  ProtectionSizingParsedInput,
} from "../types";

function parseNumber(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseDraft(
  draft: ProtectionSizingFormDraft,
): ProtectionSizingParsedInput {
  const safety = parseOptionalNumber(draft.safetyFactor);
  const fault = parseOptionalNumber(draft.availableFaultCurrentKa);
  const devV = parseOptionalNumber(draft.deviceVoltageRatingV);
  const devI = parseOptionalNumber(draft.deviceInterruptRatingKa);
  const devA = parseOptionalNumber(draft.deviceCurrentRatingA);

  const base = {
    role: draft.role,
    voltageType: draft.voltageType,
    technology: draft.technology,
    continuousCurrentA: parseNumber(draft.continuousCurrentA, 0),
    systemVoltageV: parseNumber(draft.systemVoltageV, 0),
  };

  return {
    ...base,
    ...(safety !== undefined ? { safetyFactor: safety } : {}),
    ...(fault !== undefined ? { availableFaultCurrentKa: fault } : {}),
    ...(devV !== undefined ? { deviceVoltageRatingV: devV } : {}),
    ...(devI !== undefined ? { deviceInterruptRatingKa: devI } : {}),
    ...(devA !== undefined ? { deviceCurrentRatingA: devA } : {}),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: ProtectionSizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const current = Number.parseFloat(draft.continuousCurrentA);
  if (!Number.isFinite(current) || current <= 0) {
    errors["continuousCurrentA"] = "Continuous current must be > 0.";
  }

  const voltage = Number.parseFloat(draft.systemVoltageV);
  if (!Number.isFinite(voltage) || voltage <= 0) {
    errors["systemVoltageV"] = "System voltage must be > 0.";
  }

  if (draft.safetyFactor.trim() !== "") {
    const s = Number.parseFloat(draft.safetyFactor);
    if (!Number.isFinite(s) || s < 1) {
      errors["safetyFactor"] = "Safety factor must be >= 1.";
    }
  }

  if (draft.availableFaultCurrentKa.trim() !== "") {
    const f = Number.parseFloat(draft.availableFaultCurrentKa);
    if (!Number.isFinite(f) || f < 0) {
      errors["availableFaultCurrentKa"] = "Fault current must be >= 0.";
    }
  }

  return errors;
}

/**
 * Run the protection sizing calculation. Feature's public entry point.
 */
export function calculateProtectionSizing(
  draft: ProtectionSizingFormDraft,
): ProtectionResult {
  const parsed = parseDraft(draft);

  const input: ProtectionInput = {
    role: parsed.role,
    voltageType: parsed.voltageType,
    technology: parsed.technology,
    continuousCurrentA: parsed.continuousCurrentA,
    systemVoltageV: parsed.systemVoltageV,
    safetyFactor: parsed.safetyFactor,
    availableFaultCurrentKa: parsed.availableFaultCurrentKa,
    deviceVoltageRatingV: parsed.deviceVoltageRatingV,
    deviceInterruptRatingKa: parsed.deviceInterruptRatingKa,
    deviceCurrentRatingA: parsed.deviceCurrentRatingA,
  };

  return calculateProtection(input);
}
