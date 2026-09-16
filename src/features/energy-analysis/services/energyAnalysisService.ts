/**
 * SolarAudit — Energy Analysis feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateEnergy } from "../../../engineering/energy";
import type {
  EnergyInput,
  EnergyResult,
} from "../../../engineering/energy";
import type {
  BatteryDraft,
  EnergyAnalysisFormDraft,
  EnergyAnalysisParsedInput,
  FormValidationErrors,
  PvArrayDraft,
} from "../types";

function parseNumber(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parsePv(p: PvArrayDraft) {
  return {
    name: p.name.trim(),
    capacityKwp: parseNumber(p.capacityKwp, 0),
    peakSunHours: parseNumber(p.peakSunHours, 0),
    performanceRatio: parseNumber(p.performanceRatio, 0.8),
  };
}

function parseBattery(b: BatteryDraft) {
  return {
    name: b.name.trim(),
    capacityKwh: parseNumber(b.capacityKwh, 0),
    depthOfDischarge: parseNumber(b.depthOfDischarge, 0.9),
    roundTripEfficiency: parseNumber(b.roundTripEfficiency, 0.9),
    initialSoc: parseNumber(b.initialSoc, 0.5),
  };
}

export function parseDraft(
  draft: EnergyAnalysisFormDraft,
): EnergyAnalysisParsedInput {
  const base = {
    pvArrays: draft.pvArrays.map(parsePv),
    dailyConsumptionKwh: parseNumber(draft.dailyConsumptionKwh, 0),
    days: parseNumber(draft.days, 1),
  };
  return draft.includeBattery
    ? { ...base, battery: parseBattery(draft.battery) }
    : base;
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 */
export function validateDraft(
  draft: EnergyAnalysisFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  if (draft.pvArrays.length === 0) {
    errors["pvArrays"] = "Add at least one PV array.";
  }

  draft.pvArrays.forEach((pv, idx) => {
    if (pv.name.trim() === "") {
      errors[`pvArrays.${idx}.name`] = "Name is required.";
    }
    const kwp = Number.parseFloat(pv.capacityKwp);
    if (!Number.isFinite(kwp) || kwp <= 0) {
      errors[`pvArrays.${idx}.capacityKwp`] = "Capacity must be > 0.";
    }
    const psh = Number.parseFloat(pv.peakSunHours);
    if (!Number.isFinite(psh) || psh < 0 || psh > 24) {
      errors[`pvArrays.${idx}.peakSunHours`] =
        "Peak sun hours must be between 0 and 24.";
    }
    const pr = Number.parseFloat(pv.performanceRatio);
    if (!Number.isFinite(pr) || pr <= 0 || pr > 1) {
      errors[`pvArrays.${idx}.performanceRatio`] =
        "Performance ratio must be between 0 and 1.";
    }
  });

  const cons = Number.parseFloat(draft.dailyConsumptionKwh);
  if (!Number.isFinite(cons) || cons < 0) {
    errors["dailyConsumptionKwh"] = "Daily consumption must be >= 0.";
  }

  const days = Number.parseInt(draft.days, 10);
  if (!Number.isFinite(days) || days < 1) {
    errors["days"] = "Days must be an integer >= 1.";
  }

  if (draft.includeBattery) {
    const cap = Number.parseFloat(draft.battery.capacityKwh);
    if (!Number.isFinite(cap) || cap <= 0) {
      errors["battery.capacityKwh"] = "Battery capacity must be > 0.";
    }
    const dod = Number.parseFloat(draft.battery.depthOfDischarge);
    if (!Number.isFinite(dod) || dod <= 0 || dod > 1) {
      errors["battery.depthOfDischarge"] =
        "Depth of discharge must be between 0 and 1.";
    }
    const rte = Number.parseFloat(draft.battery.roundTripEfficiency);
    if (!Number.isFinite(rte) || rte <= 0 || rte > 1) {
      errors["battery.roundTripEfficiency"] =
        "Round-trip efficiency must be between 0 and 1.";
    }
    const soc = Number.parseFloat(draft.battery.initialSoc);
    if (!Number.isFinite(soc) || soc < 0 || soc > 1) {
      errors["battery.initialSoc"] =
        "Initial SoC must be between 0 and 1.";
    }
  }

  return errors;
}

/**
 * Run the energy analysis. Feature's public entry point.
 */
export function calculateEnergyAnalysis(
  draft: EnergyAnalysisFormDraft,
): EnergyResult {
  const parsed = parseDraft(draft);

  const input: EnergyInput = {
    pvArrays: parsed.pvArrays,
    dailyConsumptionKwh: parsed.dailyConsumptionKwh,
    days: parsed.days,
    ...(parsed.battery ? { battery: parsed.battery } : {}),
  };

  return calculateEnergy(input);
}
