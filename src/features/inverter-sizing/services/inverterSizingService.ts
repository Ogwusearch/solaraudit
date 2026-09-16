/**
 * SolarAudit — Inverter Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateInverter } from "../../../engineering/inverter";
import type {
  InverterInput,
  InverterResult,
} from "../../../engineering/inverter";
import type {
  FormValidationErrors,
  InverterSizingFormDraft,
  InverterSizingParsedInput,
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
  draft: InverterSizingFormDraft,
): InverterSizingParsedInput {
  const surgeDuration = parseOptionalNumber(draft.surgeDurationSec);
  const maxDc = parseOptionalNumber(draft.maxDcInputCurrentA);

  const base = {
    continuousLoadW: parseNumber(draft.continuousLoadW, 0),
    peakLoadW: parseNumber(draft.peakLoadW, 0),
    surgeLoadW: parseNumber(draft.surgeLoadW, 0),
    systemVoltage: parseNumber(draft.systemVoltage, 48),
    outputVoltage: parseNumber(draft.outputVoltage, 230),
    outputFrequency: parseNumber(draft.outputFrequency, 50),
    powerFactor: parseNumber(draft.powerFactor, 0.8),
    designMargin: parseNumber(draft.designMargin, 0.25),
    inverterEfficiency: parseNumber(draft.inverterEfficiency, 0.9),
    type: draft.type,
    topology: draft.topology,
  };

  return {
    ...base,
    ...(surgeDuration !== undefined ? { surgeDurationSec: surgeDuration } : {}),
    ...(maxDc !== undefined ? { maxDcInputCurrentA: maxDc } : {}),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: InverterSizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const cont = Number.parseFloat(draft.continuousLoadW);
  if (!Number.isFinite(cont) || cont <= 0) {
    errors["continuousLoadW"] = "Continuous load must be > 0.";
  }

  const peak = Number.parseFloat(draft.peakLoadW);
  if (!Number.isFinite(peak) || peak <= 0) {
    errors["peakLoadW"] = "Peak load must be > 0.";
  } else if (Number.isFinite(cont) && peak < cont) {
    errors["peakLoadW"] = "Peak load must be >= continuous load.";
  }

  const surge = Number.parseFloat(draft.surgeLoadW);
  if (!Number.isFinite(surge) || surge <= 0) {
    errors["surgeLoadW"] = "Surge load must be > 0.";
  } else if (Number.isFinite(peak) && surge < peak) {
    errors["surgeLoadW"] = "Surge load must be >= peak load.";
  }

  const v = Number.parseFloat(draft.systemVoltage);
  if (!Number.isFinite(v) || v <= 0) {
    errors["systemVoltage"] = "System voltage must be > 0.";
  }

  const ov = Number.parseFloat(draft.outputVoltage);
  if (!Number.isFinite(ov) || ov <= 0) {
    errors["outputVoltage"] = "Output voltage must be > 0.";
  }

  const of = Number.parseFloat(draft.outputFrequency);
  if (!Number.isFinite(of) || of <= 0) {
    errors["outputFrequency"] = "Output frequency must be > 0.";
  }

  const pf = Number.parseFloat(draft.powerFactor);
  if (!Number.isFinite(pf) || pf <= 0 || pf > 1) {
    errors["powerFactor"] = "Power factor must be between 0 and 1.";
  }

  const dm = Number.parseFloat(draft.designMargin);
  if (!Number.isFinite(dm) || dm < 0) {
    errors["designMargin"] = "Design margin must be >= 0.";
  }

  const eff = Number.parseFloat(draft.inverterEfficiency);
  if (!Number.isFinite(eff) || eff <= 0 || eff > 1) {
    errors["inverterEfficiency"] = "Efficiency must be between 0 and 1.";
  }

  return errors;
}

/**
 * Run the inverter sizing calculation. Feature's public entry point.
 */
export function calculateInverterSizing(
  draft: InverterSizingFormDraft,
): InverterResult {
  const parsed = parseDraft(draft);

  const input: InverterInput = {
    continuousLoadW: parsed.continuousLoadW,
    peakLoadW: parsed.peakLoadW,
    surgeLoadW: parsed.surgeLoadW,
    systemVoltage: parsed.systemVoltage,
    outputVoltage: parsed.outputVoltage,
    outputFrequency: parsed.outputFrequency,
    powerFactor: parsed.powerFactor,
    designMargin: parsed.designMargin,
    inverterEfficiency: parsed.inverterEfficiency,
    type: parsed.type,
    topology: parsed.topology,
    surgeDurationSec: parsed.surgeDurationSec,
    maxDcInputCurrentA: parsed.maxDcInputCurrentA,
  };

  return calculateInverter(input);
}
