import { describe, it, expect } from "vitest";
import { createSettingsService, validateDraft } from "../services/settingsService";
import { createInMemorySettingsRepository } from "../services/inMemorySettingsRepository";
import { createDefaultSettings } from "../services/defaultSettings";
import { toDraft } from "../services/settingsMapper";
import type { SettingsDraft } from "../types";

function makeService() {
  return createSettingsService(createInMemorySettingsRepository());
}

const draft: SettingsDraft = {
  app: {
    theme: "dark",
    language: "en",
    dateFormat: "ISO",
    currency: "usd",
  },
  engineering: {
    defaultSystemVoltage: "48",
    defaultPeakSunHours: "4.5",
    defaultPvDesignMargin: "0.2",
    defaultBatteryDod: "0.8",
    defaultBatteryRte: "0.9",
    defaultTemperatureDerating: "0.85",
    defaultCableDropPercent: "3",
    defaultAmbientTemperatureC: "30",
  },
};

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(draft)).toEqual({});
  });

  it("flags bad currency", () => {
    expect(validateDraft({
      ...draft,
      app: { ...draft.app, currency: "US" },
    })["app.currency"]).toBeDefined();
  });

  it("flags missing language", () => {
    expect(validateDraft({
      ...draft,
      app: { ...draft.app, language: "" },
    })["app.language"]).toBeDefined();
  });

  it("flags non-positive system voltage", () => {
    expect(validateDraft({
      ...draft,
      engineering: { ...draft.engineering, defaultSystemVoltage: "0" },
    })["engineering.defaultSystemVoltage"]).toBeDefined();
  });

  it("flags peak sun hours out of range", () => {
    expect(validateDraft({
      ...draft,
      engineering: { ...draft.engineering, defaultPeakSunHours: "30" },
    })["engineering.defaultPeakSunHours"]).toBeDefined();
  });

  it("flags DoD out of range", () => {
    expect(validateDraft({
      ...draft,
      engineering: { ...draft.engineering, defaultBatteryDod: "1.5" },
    })["engineering.defaultBatteryDod"]).toBeDefined();
  });

  it("flags bad ambient temperature", () => {
    expect(validateDraft({
      ...draft,
      engineering: { ...draft.engineering, defaultAmbientTemperatureC: "100" },
    })["engineering.defaultAmbientTemperatureC"]).toBeDefined();
  });
});

describe("settingsService", () => {
  it("loads built-in defaults on first read", async () => {
    const svc = makeService();
    const s = await svc.load();
    expect(s.schemaVersion).toBe(1);
    expect(s.app.theme).toBe("system");
    expect(s.app.currency).toBe("USD");
    expect(s.engineering.defaultPvDesignMargin).toBe(0.25);
  });

  it("save persists the parsed settings", async () => {
    const svc = makeService();
    const saved = await svc.save(draft);
    expect(saved.app.theme).toBe("dark");
    // currency normalised
    expect(saved.app.currency).toBe("USD");
    expect(saved.engineering.defaultPvDesignMargin).toBe(0.2);

    const reread = await svc.load();
    expect(reread.app.theme).toBe("dark");
    expect(reread.engineering.defaultPvDesignMargin).toBe(0.2);
  });

  it("save stamps updatedAt", async () => {
    const svc = makeService();
    const before = await svc.load();
    await new Promise((r) => setTimeout(r, 5));
    const after = await svc.save(draft);
    expect(after.updatedAt >= before.updatedAt).toBe(true);
  });

  it("resetToDefaults restores the built-in values", async () => {
    const svc = makeService();
    await svc.save(draft);
    const reset = await svc.resetToDefaults();
    expect(reset.app.theme).toBe("system");
    expect(reset.engineering.defaultPvDesignMargin).toBe(0.25);
    expect(reset.updatedAt).not.toBe(createDefaultSettings().updatedAt);
  });
});

describe("settingsMapper", () => {
  it("round-trips defaults through draft", () => {
    const settings = createDefaultSettings();
    const d = toDraft(settings);
    expect(d.app.theme).toBe(settings.app.theme);
    expect(d.engineering.defaultPvDesignMargin).toBe(
      String(settings.engineering.defaultPvDesignMargin),
    );
  });
});
