/**
 * SolarAudit — Battery Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateBattery } from "../../../engineering/battery";
import type {
  BatteryInput,
  BatteryResult,
} from "../../../engineering/battery";
import type {
  BatterySizingFormDraft,
  BatterySizingParsedInput,
  CellSpecDraft,
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

function parseCell(c: CellSpecDraft) {
  const maxCharge = parseOptionalNumber(c.maxChargeCurrentA);
  const base = {
    name: c.name.trim(),
    technology: c.technology,
    nominalVoltage: parseNumber(c.nominalVoltage, 0),
    capacityAh: parseNumber(c.capacityAh, 0),
    maxDepthOfDischarge: parseNumber(c.maxDepthOfDischarge, 0.9),
    roundTripEfficiency: parseNumber(c.roundTripEfficiency, 0.95),
  };
  return maxCharge !== undefined
    ? { ...base, maxChargeCurrentA: maxCharge }
    : base;
}

export function parseDraft(
  draft: BatterySizingFormDraft,
): BatterySizingParsedInput {
  const maxParallel = parseOptionalNumber(draft.maxParallelStrings);
  const base = {
    dailyEnergyKwh: parseNumber(draft.dailyEnergyKwh, 0),
    autonomyDays: parseNumber(draft.autonomyDays, 1),
    systemVoltage: parseNumber(draft.systemVoltage, 48),
    designMargin: parseNumber(draft.designMargin, 0.1),
    temperatureDerating: parseNumber(draft.temperatureDerating, 0.85),
    maxDepthOfDischarge: parseNumber(draft.maxDepthOfDischarge, 0.8),
    roundTripEfficiency: parseNumber(draft.roundTripEfficiency, 0.9),
    cell: parseCell(draft.cell),
  };
  return maxParallel !== undefined
    ? { ...base, maxParallelStrings: maxParallel }
    : base;
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: BatterySizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const de = Number.parseFloat(draft.dailyEnergyKwh);
  if (!Number.isFinite(de) || de <= 0) {
    errors["dailyEnergyKwh"] = "Daily energy must be > 0.";
  }

  const aut = Number.parseFloat(draft.autonomyDays);
  if (!Number.isFinite(aut) || aut < 0) {
    errors["autonomyDays"] = "Autonomy must be >= 0.";
  }

  const v = Number.parseFloat(draft.systemVoltage);
  if (!Number.isFinite(v) || v <= 0) {
    errors["systemVoltage"] = "System voltage must be > 0.";
  }

  const dm = Number.parseFloat(draft.designMargin);
  if (!Number.isFinite(dm) || dm < 0) {
    errors["designMargin"] = "Design margin must be >= 0.";
  }

  const td = Number.parseFloat(draft.temperatureDerating);
  if (!Number.isFinite(td) || td <= 0 || td > 1) {
    errors["temperatureDerating"] =
      "Temperature derating must be between 0 and 1.";
  }

  const dod = Number.parseFloat(draft.maxDepthOfDischarge);
  if (!Number.isFinite(dod) || dod <= 0 || dod > 1) {
    errors["maxDepthOfDischarge"] =
      "Design DoD must be between 0 and 1.";
  }

  const rte = Number.parseFloat(draft.roundTripEfficiency);
  if (!Number.isFinite(rte) || rte <= 0 || rte > 1) {
    errors["roundTripEfficiency"] =
      "Round-trip efficiency must be between 0 and 1.";
  }

  const c = draft.cell;
  if (c.name.trim() === "") {
    errors["cell.name"] = "Cell name is required.";
  }

  const cv = Number.parseFloat(c.nominalVoltage);
  if (!Number.isFinite(cv) || cv <= 0) {
    errors["cell.nominalVoltage"] = "Cell voltage must be > 0.";
  }

  const cap = Number.parseFloat(c.capacityAh);
  if (!Number.isFinite(cap) || cap <= 0) {
    errors["cell.capacityAh"] = "Cell capacity must be > 0.";
  }

  const cdod = Number.parseFloat(c.maxDepthOfDischarge);
  if (!Number.isFinite(cdod) || cdod <= 0 || cdod > 1) {
    errors["cell.maxDepthOfDischarge"] =
      "Cell max DoD must be between 0 and 1.";
  }

  const crte = Number.parseFloat(c.roundTripEfficiency);
  if (!Number.isFinite(crte) || crte <= 0 || crte > 1) {
    errors["cell.roundTripEfficiency"] =
      "Cell RTE must be between 0 and 1.";
  }

  return errors;
}

/**
 * Run the battery sizing calculation. Feature's public entry point.
 */
export function calculateBatterySizing(
  draft: BatterySizingFormDraft,
): BatteryResult {
  const parsed = parseDraft(draft);

  const input: BatteryInput = {
    dailyEnergyKwh: parsed.dailyEnergyKwh,
    autonomyDays: parsed.autonomyDays,
    systemVoltage: parsed.systemVoltage,
    designMargin: parsed.designMargin,
    temperatureDerating: parsed.temperatureDerating,
    maxDepthOfDischarge: parsed.maxDepthOfDischarge,
    roundTripEfficiency: parsed.roundTripEfficiency,
    cell: parsed.cell,
    maxParallelStrings: parsed.maxParallelStrings,
  };

  return calculateBattery(input);
}
