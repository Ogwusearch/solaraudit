/**
 * SolarAudit — Voltage Drop feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateVoltageDrop } from "../../../engineering/voltage-drop";
import type {
  VoltageDropInput,
  VoltageDropResult,
} from "../../../engineering/voltage-drop";
import type {
  FormValidationErrors,
  VoltageDropFormDraft,
  VoltageDropParsedInput,
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
  draft: VoltageDropFormDraft,
): VoltageDropParsedInput {
  const area = parseOptionalNumber(draft.conductorAreaMm2);
  const target = parseOptionalNumber(draft.targetDropPercent);
  const temp = parseOptionalNumber(draft.conductorTempC);
  const pf = parseOptionalNumber(draft.powerFactor);
  const x = parseOptionalNumber(draft.reactanceOhmPerKm);

  const base = {
    currentA: parseNumber(draft.currentA, 0),
    lengthM: parseNumber(draft.lengthM, 0),
    systemVoltageV: parseNumber(draft.systemVoltageV, 0),
    material: draft.material,
    circuitType: draft.circuitType,
  };

  return {
    ...base,
    ...(area !== undefined ? { conductorAreaMm2: area } : {}),
    ...(target !== undefined ? { targetDropPercent: target } : {}),
    ...(temp !== undefined ? { conductorTempC: temp } : {}),
    ...(pf !== undefined ? { powerFactor: pf } : {}),
    ...(x !== undefined ? { reactanceOhmPerKm: x } : {}),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 *
 * The engine requires at least one mode (area OR target). This catches
 * the missing-both case before the engine has to. Providing both is
 * valid — the engine returns drop AND the solved minimum area.
 */
export function validateDraft(
  draft: VoltageDropFormDraft,
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

  const voltage = Number.parseFloat(draft.systemVoltageV);
  if (!Number.isFinite(voltage) || voltage <= 0) {
    errors["systemVoltageV"] = "System voltage must be > 0.";
  }

  const areaRaw = draft.conductorAreaMm2.trim();
  const targetRaw = draft.targetDropPercent.trim();

  if (areaRaw === "" && targetRaw === "") {
    errors["conductorAreaMm2"] =
      "Provide a conductor area (forward) or a target drop % (inverse).";
  }

  if (areaRaw !== "") {
    const a = Number.parseFloat(areaRaw);
    if (!Number.isFinite(a) || a <= 0) {
      errors["conductorAreaMm2"] = "Conductor area must be > 0.";
    }
  }

  if (targetRaw !== "") {
    const t = Number.parseFloat(targetRaw);
    if (!Number.isFinite(t) || t <= 0) {
      errors["targetDropPercent"] = "Target drop must be > 0.";
    }
  }

  if (draft.conductorTempC.trim() !== "") {
    const c = Number.parseFloat(draft.conductorTempC);
    if (!Number.isFinite(c) || c < 30 || c > 120) {
      errors["conductorTempC"] =
        "Conductor temperature must be between 30 and 120 °C.";
    }
  }

  if (draft.powerFactor.trim() !== "") {
    const pf = Number.parseFloat(draft.powerFactor);
    if (!Number.isFinite(pf) || pf < 0.1 || pf > 1) {
      errors["powerFactor"] =
        "Power factor must be between 0.1 and 1.0.";
    }
  }

  if (draft.reactanceOhmPerKm.trim() !== "") {
    const x = Number.parseFloat(draft.reactanceOhmPerKm);
    if (!Number.isFinite(x) || x < 0) {
      errors["reactanceOhmPerKm"] = "Reactance must be >= 0.";
    }
  }

  return errors;
}

/**
 * Run the voltage-drop calculation. Feature's public entry point.
 */
export function calculateVoltageDropFromDraft(
  draft: VoltageDropFormDraft,
): VoltageDropResult {
  const parsed = parseDraft(draft);

  const input: VoltageDropInput = {
    currentA: parsed.currentA,
    lengthM: parsed.lengthM,
    systemVoltageV: parsed.systemVoltageV,
    material: parsed.material,
    circuitType: parsed.circuitType,
    conductorAreaMm2: parsed.conductorAreaMm2,
    targetDropPercent: parsed.targetDropPercent,
    conductorTempC: parsed.conductorTempC,
    powerFactor: parsed.powerFactor,
    reactanceOhmPerKm: parsed.reactanceOhmPerKm,
  };

  return calculateVoltageDrop(input);
}
