/**
 * SolarAudit — Settings feature: Repository interface
 *
 * The seam between the Settings feature and whatever storage backs it.
 * Settings is a singleton record — get and set, no list, no create,
 * no delete.
 *
 * The feature NEVER imports a database or localStorage client directly.
 */

import type { Settings } from "../types";

export interface SettingsRepository {
  get(): Promise<Settings>;
  set(settings: Settings): Promise<Settings>;
}
