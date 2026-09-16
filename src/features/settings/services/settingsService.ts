/**
 * SolarAudit — Settings feature: Application service
 *
 * The ONLY place the feature reaches persistence.
 *
 * Responsibilities:
 *   - Load settings (get)
 *   - Save settings (set), after parsing the draft and stamping the
 *     updatedAt timestamp
 *   - Reset to defaults
 *   - Validate the draft
 *
 * NOT responsible for:
 *   - Rendering
 *   - Feeding the defaults into other features (that is a future
 *     revision to those features' factories)
 */

import type {
  EngineeringDefaults,
  FormValidationErrors,
  Settings,
  SettingsDraft,
} from "../types";
import type { SettingsRepository } from "./settingsRepository";
import {
  CURRENT_SCHEMA_VERSION,
  createDefaultSettings,
} from "./defaultSettings";

export interface SettingsService {
  load(): Promise<Settings>;
  save(draft: SettingsDraft): Promise<Settings>;
  resetToDefaults(): Promise<Settings>;
}

function parseNumber(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseEngineeringDefaults(
  draft: SettingsDraft["engineering"],
): EngineeringDefaults {
  return {
    defaultSystemVoltage: parseNumber(draft.defaultSystemVoltage, 48),
    defaultPeakSunHours: parseNumber(draft.defaultPeakSunHours, 4.5),
    defaultPvDesignMargin: parseNumber(draft.defaultPvDesignMargin, 0.25),
    defaultBatteryDod: parseNumber(draft.defaultBatteryDod, 0.8),
    defaultBatteryRte: parseNumber(draft.defaultBatteryRte, 0.9),
    defaultTemperatureDerating: parseNumber(
      draft.defaultTemperatureDerating,
      0.85,
    ),
    defaultCableDropPercent: parseNumber(draft.defaultCableDropPercent, 3),
    defaultAmbientTemperatureC: parseNumber(draft.defaultAmbientTemperatureC, 30),
  };
}

export function createSettingsService(
  repo: SettingsRepository,
): SettingsService {
  return {
    async load() {
      return repo.get();
    },

    async save(draft) {
      const parsed: Settings = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        app: {
          theme: draft.app.theme,
          language: draft.app.language.trim() || "en",
          dateFormat: draft.app.dateFormat,
          currency: draft.app.currency.trim().toUpperCase() || "USD",
        },
        engineering: parseEngineeringDefaults(draft.engineering),
        updatedAt: new Date().toISOString(),
      };
      return repo.set(parsed);
    },

    async resetToDefaults() {
      const defaults = createDefaultSettings();
      return repo.set({
        ...defaults,
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

/**
 * Form-level validation of a settings draft. There is no engineering
 * validation — Settings is not a sizing engine.
 */
export function validateDraft(
  draft: SettingsDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const currency = draft.app.currency.trim();
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    errors["app.currency"] = "Currency must be a 3-letter ISO 4217 code.";
  }

  const language = draft.app.language.trim();
  if (language === "") {
    errors["app.language"] = "Language is required.";
  }

  const v = Number.parseFloat(draft.engineering.defaultSystemVoltage);
  if (!Number.isFinite(v) || v <= 0) {
    errors["engineering.defaultSystemVoltage"] =
      "System voltage must be > 0.";
  }

  const psh = Number.parseFloat(draft.engineering.defaultPeakSunHours);
  if (!Number.isFinite(psh) || psh < 0 || psh > 24) {
    errors["engineering.defaultPeakSunHours"] =
      "Peak sun hours must be between 0 and 24.";
  }

  const margin = Number.parseFloat(draft.engineering.defaultPvDesignMargin);
  if (!Number.isFinite(margin) || margin < 0) {
    errors["engineering.defaultPvDesignMargin"] =
      "PV design margin must be >= 0.";
  }

  const dod = Number.parseFloat(draft.engineering.defaultBatteryDod);
  if (!Number.isFinite(dod) || dod <= 0 || dod > 1) {
    errors["engineering.defaultBatteryDod"] =
      "Battery DoD must be between 0 and 1.";
  }

  const rte = Number.parseFloat(draft.engineering.defaultBatteryRte);
  if (!Number.isFinite(rte) || rte <= 0 || rte > 1) {
    errors["engineering.defaultBatteryRte"] =
      "Battery RTE must be between 0 and 1.";
  }

  const td = Number.parseFloat(draft.engineering.defaultTemperatureDerating);
  if (!Number.isFinite(td) || td <= 0 || td > 1) {
    errors["engineering.defaultTemperatureDerating"] =
      "Temperature derating must be between 0 and 1.";
  }

  const drop = Number.parseFloat(draft.engineering.defaultCableDropPercent);
  if (!Number.isFinite(drop) || drop <= 0) {
    errors["engineering.defaultCableDropPercent"] =
      "Cable drop must be > 0.";
  }

  const amb = Number.parseFloat(draft.engineering.defaultAmbientTemperatureC);
  if (!Number.isFinite(amb) || amb < -20 || amb > 80) {
    errors["engineering.defaultAmbientTemperatureC"] =
      "Ambient temperature must be between -20 and 80 °C.";
  }

  return errors;
}
