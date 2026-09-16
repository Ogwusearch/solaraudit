/**
 * SolarAudit — Cable Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateCable } from "../../../engineering/cable";
import type {
  CableInput,
  CableResult,
} from "../../../engineering/cable";
import type {
  CableSizingFormDraft,
  CableSizingParsedInput,
  FormValidationErrors,
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
  draft: CableSizingFormDraft,
): CableSizingParsedInput {
  const ambient = parseOptionalNumber(draft.ambientTemperatureC);
  const conductor = parseOptionalNumber(draft.conductorTempC);
  const grouping = parseOptionalNumber(draft.groupingCount);
  const margin = parseOptionalNumber(draft.designMargin);

  const base = {
    currentA: parseNumber(draft.currentA, 0),
    lengthM: parseNumber(draft.lengthM, 0),
    systemVoltage: parseNumber(draft.systemVoltage, 0),
    allowableDropPercent: parseNumber(draft.allowableDropPercent, 3),
    material: draft.material,
    circuitType: draft.circuitType,
    installationMethod: draft.installationMethod,
  };

  return {
    ...base,
    ...(ambient !== undefined ? { ambientTemperatureC: ambient } : {}),
    ...(conductor !== undefined ? { conductorTempC: conductor } : {}),
    ...(grouping !== undefined ? { groupingCount: grouping } : {}),
    ...(margin !== undefined ? { designMargin: margin } : {}),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: CableSizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const current = Number.parseFloat(draft.currentA);
  if (!Number.isFinite(current) || current <= 0) {
    errors["currentA"] = "Current must be > 0.";
  }

  const length = Number.parseFloat(draft.lengthM);
  if (!Number.isFinite(length) || length <= 0) {
    errors["lengthM"] = "Length must be > 0.";
  }

  const voltage = Number.parseFloat(draft.systemVoltage);
  if (!Number.isFinite(voltage) || voltage <= 0) {
    errors["systemVoltage"] = "System voltage must be > 0.";
  }

  const drop = Number.parseFloat(draft.allowableDropPercent);
  if (!Number.isFinite(drop) || drop <= 0) {
    errors["allowableDropPercent"] = "Allowable drop must be > 0.";
  }

  if (draft.ambientTemperatureC.trim() !== "") {
    const a = Number.parseFloat(draft.ambientTemperatureC);
    if (!Number.isFinite(a) || a < -20 || a > 80) {
      errors["ambientTemperatureC"] =
        "Ambient temperature must be between -20 and 80 °C.";
    }
  }

  if (draft.conductorTempC.trim() !== "") {
    const c = Number.parseFloat(draft.conductorTempC);
    if (!Number.isFinite(c) || c < 30 || c > 120) {
      errors["conductorTempC"] =
        "Conductor temperature must be between 30 and 120 °C.";
    }
  }

  if (draft.groupingCount.trim() !== "") {
    const g = Number.parseInt(draft.groupingCount, 10);
    if (!Number.isFinite(g) || g < 1) {
      errors["groupingCount"] = "Grouping count must be an integer >= 1.";
    }
  }

  if (draft.designMargin.trim() !== "") {
    const m = Number.parseFloat(draft.designMargin);
    if (!Number.isFinite(m) || m < 0) {
      errors["designMargin"] = "Design margin must be >= 0.";
    }
  }

  return errors;
}

/**
 * Run the cable sizing calculation. Feature's public entry point.
 */
export function calculateCableSizing(
  draft: CableSizingFormDraft,
): CableResult {
  const parsed = parseDraft(draft);

  const input: CableInput = {
    currentA: parsed.currentA,
    lengthM: parsed.lengthM,
    systemVoltage: parsed.systemVoltage,
    allowableDropPercent: parsed.allowableDropPercent,
    material: parsed.material,
    circuitType: parsed.circuitType,
    installationMethod: parsed.installationMethod,
    ambientTemperatureC: parsed.ambientTemperatureC,
    conductorTempC: parsed.conductorTempC,
    groupingCount: parsed.groupingCount,
    designMargin: parsed.designMargin,
  };

  return calculateCable(input);
}
