/**
 * SolarAudit — Settings feature: Built-in defaults
 *
 * The values used the first time the app runs, and every time the user
 * clicks "Reset to defaults".
 *
 * These mirror the engineering engines' own hard-coded defaults so that
 * fresh settings and fresh engine behaviour agree. When an engine's
 * default changes, this file changes too — that is intentional, so
 * there is a single place to look for "what does SolarAudit assume out
 * of the box".
 */

import type { Settings } from "../types";

export const CURRENT_SCHEMA_VERSION = 1;

export function createDefaultSettings(): Settings {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    app: {
      theme: "system",
      language: "en",
      dateFormat: "ISO",
      currency: "USD",
    },
    engineering: {
      defaultSystemVoltage: 48,
      defaultPeakSunHours: 4.5,
      defaultPvDesignMargin: 0.25,
      defaultBatteryDod: 0.8,
      defaultBatteryRte: 0.9,
      defaultTemperatureDerating: 0.85,
      defaultCableDropPercent: 3,
      defaultAmbientTemperatureC: 30,
    },
    updatedAt: new Date(0).toISOString(),
  };
}
