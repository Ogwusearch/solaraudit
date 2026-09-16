/**
 * SolarAudit — Charge Controller Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 *
 * NOTE: This engine has TWO layers of validation:
 *   1. Structural (missing/invalid fields) — checked by the engine's
 *      validateInput, short-circuits to isValid:false.
 *   2. Electrical compatibility (Voc/Isc/output current/PWM Vmp) —
 *      checked during calculation, so isValid:false can come from here too.
 *
 * The service preserves both — it does not second-guess the engine.
 */

import { calculateChargeController } from "../../../engineering/charge-controller";
import type {
  ChargeControllerInput,
  ChargeControllerResult,
} from "../../../engineering/charge-controller";
import type {
  ChargeControllerSizingFormDraft,
  ChargeControllerSizingParsedInput,
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
  draft: ChargeControllerSizingFormDraft,
): ChargeControllerSizingParsedInput {
  const maxV = parseOptionalNumber(draft.maxPvInputVoltage);
  const maxI = parseOptionalNumber(draft.maxPvInputCurrentA);
  const maxO = parseOptionalNumber(draft.maxOutputCurrentA);

  const base = {
    pvArrayKwp: parseNumber(draft.pvArrayKwp, 0),
    pvVmp: parseNumber(draft.pvVmp, 0),
    pvVoc: parseNumber(draft.pvVoc, 0),
    pvImp: parseNumber(draft.pvImp, 0),
    pvIsc: parseNumber(draft.pvIsc, 0),
    batteryVoltage: parseNumber(draft.batteryVoltage, 0),
    batteryCapacityAh: parseNumber(draft.batteryCapacityAh, 0),
    technology: draft.technology,
    designMargin: parseNumber(draft.designMargin, 0.25),
    controllerEfficiency: parseNumber(draft.controllerEfficiency, 0.95),
  };

  return {
    ...base,
    ...(maxV !== undefined ? { maxPvInputVoltage: maxV } : {}),
    ...(maxI !== undefined ? { maxPvInputCurrentA: maxI } : {}),
    ...(maxO !== undefined ? { maxOutputCurrentA: maxO } : {}),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: ChargeControllerSizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const kwp = Number.parseFloat(draft.pvArrayKwp);
  if (!Number.isFinite(kwp) || kwp <= 0) {
    errors["pvArrayKwp"] = "PV array power must be > 0.";
  }

  const vmp = Number.parseFloat(draft.pvVmp);
  if (!Number.isFinite(vmp) || vmp <= 0) {
    errors["pvVmp"] = "Array Vmp must be > 0.";
  }

  const voc = Number.parseFloat(draft.pvVoc);
  if (!Number.isFinite(voc) || voc <= 0) {
    errors["pvVoc"] = "Array Voc must be > 0.";
  }

  const imp = Number.parseFloat(draft.pvImp);
  if (!Number.isFinite(imp) || imp <= 0) {
    errors["pvImp"] = "Array Imp must be > 0.";
  }

  const isc = Number.parseFloat(draft.pvIsc);
  if (!Number.isFinite(isc) || isc <= 0) {
    errors["pvIsc"] = "Array Isc must be > 0.";
  }

  const bv = Number.parseFloat(draft.batteryVoltage);
  if (!Number.isFinite(bv) || bv <= 0) {
    errors["batteryVoltage"] = "Battery voltage must be > 0.";
  }

  const bcap = Number.parseFloat(draft.batteryCapacityAh);
  if (!Number.isFinite(bcap) || bcap <= 0) {
    errors["batteryCapacityAh"] = "Battery capacity must be > 0.";
  }

  const dm = Number.parseFloat(draft.designMargin);
  if (!Number.isFinite(dm) || dm < 0) {
    errors["designMargin"] = "Design margin must be >= 0.";
  }

  const eff = Number.parseFloat(draft.controllerEfficiency);
  if (!Number.isFinite(eff) || eff <= 0 || eff > 1) {
    errors["controllerEfficiency"] = "Efficiency must be between 0 and 1.";
  }

  return errors;
}

/**
 * Run the charge controller sizing calculation. Feature's public entry point.
 */
export function calculateChargeControllerSizing(
  draft: ChargeControllerSizingFormDraft,
): ChargeControllerResult {
  const parsed = parseDraft(draft);

  const input: ChargeControllerInput = {
    pvArrayKwp: parsed.pvArrayKwp,
    pvVmp: parsed.pvVmp,
    pvVoc: parsed.pvVoc,
    pvImp: parsed.pvImp,
    pvIsc: parsed.pvIsc,
    batteryVoltage: parsed.batteryVoltage,
    batteryCapacityAh: parsed.batteryCapacityAh,
    technology: parsed.technology,
    designMargin: parsed.designMargin,
    controllerEfficiency: parsed.controllerEfficiency,
    maxPvInputVoltage: parsed.maxPvInputVoltage,
    maxPvInputCurrentA: parsed.maxPvInputCurrentA,
    maxOutputCurrentA: parsed.maxOutputCurrentA,
  };

  return calculateChargeController(input);
}
