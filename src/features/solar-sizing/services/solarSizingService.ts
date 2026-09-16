/**
 * SolarAudit — Solar Sizing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 * Parses the UI draft into the engine's typed input, calls the engine,
 * and returns its result unchanged.
 */

import { calculateSolar } from "../../../engineering/solar";
import type { SolarInput, SolarResult } from "../../../engineering/solar";
import type {
  PanelSpecDraft,
  SolarSizingFormDraft,
  SolarSizingParsedInput,
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

function parsePanel(p: PanelSpecDraft) {
  return {
    name: p.name.trim(),
    ratedPowerWatts: parseNumber(p.ratedPowerWatts, 0),
    vmp: parseNumber(p.vmp, 0),
    imp: parseNumber(p.imp, 0),
    voc: parseNumber(p.voc, 0),
    isc: parseNumber(p.isc, 0),
  };
}

export function parseDraft(
  draft: SolarSizingFormDraft,
): SolarSizingParsedInput {
  return {
    dailyEnergyKwh: parseNumber(draft.dailyEnergyKwh, 0),
    peakSunHours: parseNumber(draft.peakSunHours, 0),
    systemEfficiency: parseNumber(draft.systemEfficiency, 0.75),
    designMargin: parseNumber(draft.designMargin, 0.25),
    panel: parsePanel(draft.panel),
    maxSeriesPanels: parseOptionalNumber(draft.maxSeriesPanels),
    maxParallelStrings: parseOptionalNumber(draft.maxParallelStrings),
    maxArrayVoc: parseOptionalNumber(draft.maxArrayVoc),
    minArrayVmp: parseOptionalNumber(draft.minArrayVmp),
  };
}

/**
 * Form-level validation — is the form complete enough to try a calculation?
 * Engineering validation is done by the engine itself.
 */
export function validateDraft(
  draft: SolarSizingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const de = Number.parseFloat(draft.dailyEnergyKwh);
  if (!Number.isFinite(de) || de <= 0) {
    errors["dailyEnergyKwh"] = "Daily energy must be > 0.";
  }

  const psh = Number.parseFloat(draft.peakSunHours);
  if (!Number.isFinite(psh) || psh <= 0 || psh > 24) {
    errors["peakSunHours"] = "Peak sun hours must be between 0 and 24.";
  }

  const eff = Number.parseFloat(draft.systemEfficiency);
  if (!Number.isFinite(eff) || eff <= 0 || eff > 1) {
    errors["systemEfficiency"] = "Efficiency must be between 0 and 1.";
  }

  const margin = Number.parseFloat(draft.designMargin);
  if (!Number.isFinite(margin) || margin < 0) {
    errors["designMargin"] = "Design margin must be >= 0.";
  }

  const p = draft.panel;
  if (p.name.trim() === "") {
    errors["panel.name"] = "Panel name is required.";
  }
  const pw = Number.parseFloat(p.ratedPowerWatts);
  if (!Number.isFinite(pw) || pw <= 0) {
    errors["panel.ratedPowerWatts"] = "Rated power must be > 0.";
  }
  const vmp = Number.parseFloat(p.vmp);
  if (!Number.isFinite(vmp) || vmp <= 0) {
    errors["panel.vmp"] = "Vmp must be > 0.";
  }
  const imp = Number.parseFloat(p.imp);
  if (!Number.isFinite(imp) || imp <= 0) {
    errors["panel.imp"] = "Imp must be > 0.";
  }
  const voc = Number.parseFloat(p.voc);
  if (!Number.isFinite(voc) || voc <= 0) {
    errors["panel.voc"] = "Voc must be > 0.";
  }
  const isc = Number.parseFloat(p.isc);
  if (!Number.isFinite(isc) || isc <= 0) {
    errors["panel.isc"] = "Isc must be > 0.";
  }

  return errors;
}

/**
 * Run the solar sizing calculation. The feature's public entry point.
 */
export function calculateSolarSizing(
  draft: SolarSizingFormDraft,
): SolarResult {
  const parsed = parseDraft(draft);

  const input: SolarInput = {
    dailyEnergyKwh: parsed.dailyEnergyKwh,
    peakSunHours: parsed.peakSunHours,
    systemEfficiency: parsed.systemEfficiency,
    designMargin: parsed.designMargin,
    panel: parsed.panel,
    maxSeriesPanels: parsed.maxSeriesPanels,
    maxParallelStrings: parsed.maxParallelStrings,
    maxArrayVoc: parsed.maxArrayVoc,
    minArrayVmp: parsed.minArrayVmp,
  };

  return calculateSolar(input);
}
