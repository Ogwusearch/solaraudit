/**
 * SolarAudit — Settings feature: Types
 *
 * Feature-local domain model. NOT an engineering engine input/output.
 *
 * Two independent groups:
 *
 *   AppPreferences       — how the app looks and formats values
 *   EngineeringDefaults  — starting values the sizing features may
 *                          adopt as their own defaults in a future
 *                          revision
 *
 * Persisted settings carry a schemaVersion so the record can be
 * migrated across future shape changes.
 */

export type ThemePreference = "system" | "light" | "dark";
export type DateFormatPreference = "ISO" | "locale" | "DMY" | "MDY";

export interface AppPreferences {
  readonly theme: ThemePreference;
  readonly language: string;         // BCP 47, e.g. "en", "fr", "pt-BR"
  readonly dateFormat: DateFormatPreference;
  readonly currency: string;         // ISO 4217, 3 uppercase letters
}

export interface EngineeringDefaults {
  readonly defaultSystemVoltage: number;      // V
  readonly defaultPeakSunHours: number;       // h
  readonly defaultPvDesignMargin: number;     // fraction
  readonly defaultBatteryDod: number;         // fraction
  readonly defaultBatteryRte: number;         // fraction
  readonly defaultTemperatureDerating: number;// fraction
  readonly defaultCableDropPercent: number;   // %
  readonly defaultAmbientTemperatureC: number;// °C
}

export interface Settings {
  readonly schemaVersion: number;   // bump when the shape changes
  readonly app: AppPreferences;
  readonly engineering: EngineeringDefaults;
  readonly updatedAt: string;       // ISO 8601
}

/**
 * Editable draft — all values as strings for form binding.
 * The service parses them into the persisted shape.
 */
export interface SettingsDraft {
  readonly app: {
    readonly theme: ThemePreference;
    readonly language: string;
    readonly dateFormat: DateFormatPreference;
    readonly currency: string;
  };
  readonly engineering: {
    readonly defaultSystemVoltage: string;
    readonly defaultPeakSunHours: string;
    readonly defaultPvDesignMargin: string;
    readonly defaultBatteryDod: string;
    readonly defaultBatteryRte: string;
    readonly defaultTemperatureDerating: string;
    readonly defaultCableDropPercent: string;
    readonly defaultAmbientTemperatureC: string;
  };
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type SettingsStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "saving"
  | "saved"
  | "error";
