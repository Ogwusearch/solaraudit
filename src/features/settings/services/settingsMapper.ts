/**
 * SolarAudit — Settings feature: Mapper
 *
 * Persisted Settings <-> editable SettingsDraft.
 * Pure transformation, no side effects, no repository access.
 */

import type { Settings, SettingsDraft } from "../types";

export function toDraft(settings: Settings): SettingsDraft {
  return {
    app: {
      theme: settings.app.theme,
      language: settings.app.language,
      dateFormat: settings.app.dateFormat,
      currency: settings.app.currency,
    },
    engineering: {
      defaultSystemVoltage: String(settings.engineering.defaultSystemVoltage),
      defaultPeakSunHours: String(settings.engineering.defaultPeakSunHours),
      defaultPvDesignMargin: String(
        settings.engineering.defaultPvDesignMargin,
      ),
      defaultBatteryDod: String(settings.engineering.defaultBatteryDod),
      defaultBatteryRte: String(settings.engineering.defaultBatteryRte),
      defaultTemperatureDerating: String(
        settings.engineering.defaultTemperatureDerating,
      ),
      defaultCableDropPercent: String(
        settings.engineering.defaultCableDropPercent,
      ),
      defaultAmbientTemperatureC: String(
        settings.engineering.defaultAmbientTemperatureC,
      ),
    },
  };
}
