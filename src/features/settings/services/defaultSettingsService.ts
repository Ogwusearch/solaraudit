/**
 * SolarAudit — Settings feature: Default service instance
 *
 * Composition root for the Settings feature. Components get the
 * service from here (or from a React context that provides this same
 * object). When real persistence arrives, this file changes — nothing
 * else in the feature does.
 */

import { createInMemorySettingsRepository } from "./inMemorySettingsRepository";
import { createSettingsService } from "./settingsService";

export const defaultSettingsService = createSettingsService(
  createInMemorySettingsRepository(),
);
