/**
 * SolarAudit — Settings feature: In-memory repository
 *
 * A working stub that implements SettingsRepository without any storage.
 * When real persistence arrives, write a second implementation
 * (e.g. localStorageSettingsRepository.ts, d1SettingsRepository.ts)
 * and swap it at the composition root. Nothing else changes.
 */

import type { Settings } from "../types";
import type { SettingsRepository } from "./settingsRepository";
import { createDefaultSettings } from "./defaultSettings";

export function createInMemorySettingsRepository(
  seed: Settings = createDefaultSettings(),
): SettingsRepository {
  let current: Settings = seed;

  return {
    async get() {
      return current;
    },
    async set(settings) {
      current = settings;
      return current;
    },
  };
}
