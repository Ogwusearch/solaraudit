/**
 * SolarAudit — Settings feature: Public surface
 *
 * Consumers can use:
 *   - SettingsPage            for the settings route
 *   - useSettings             for embedding in a custom page
 *   - defaultSettingsService  to read settings outside React
 */

export { SettingsPage } from "./components/SettingsPage";
export { useSettings } from "./hooks/useSettings";
export { defaultSettingsService } from "./services/defaultSettingsService";
export { createSettingsService, validateDraft } from "./services/settingsService";
export { createInMemorySettingsRepository } from "./services/inMemorySettingsRepository";
export { createDefaultSettings } from "./services/defaultSettings";

export type {
  AppPreferences,
  DateFormatPreference,
  EngineeringDefaults,
  FormValidationErrors,
  Settings,
  SettingsDraft,
  SettingsStatus,
  ThemePreference,
} from "./types";

export type { SettingsService } from "./services/settingsService";
export type { SettingsRepository } from "./services/settingsRepository";
