import { describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSettings } from "../hooks/useSettings";
import { createSettingsService } from "../services/settingsService";
import { createInMemorySettingsRepository } from "../services/inMemorySettingsRepository";

function makeService() {
  return createSettingsService(createInMemorySettingsRepository());
}

describe("useSettings", () => {
  it("loads defaults on mount", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.draft).not.toBeNull();
    expect(result.current.draft!.app.theme).toBe("system");
    expect(result.current.isDirty).toBe(false);
  });

  it("updates app fields and marks dirty", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.setAppField("theme", "dark"));
    expect(result.current.draft!.app.theme).toBe("dark");
    expect(result.current.isDirty).toBe(true);
  });

  it("updates engineering fields and marks dirty", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() =>
      result.current.setEngineeringField("defaultPvDesignMargin", "0.2"),
    );
    expect(result.current.draft!.engineering.defaultPvDesignMargin).toBe("0.2");
    expect(result.current.isDirty).toBe(true);
  });

  it("save persists changes and clears dirty", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.setAppField("currency", "NGN"));

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.status).toBe("saved");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.baseline!.app.currency).toBe("NGN");
  });

  it("discard reverts to the last saved settings", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.setAppField("theme", "dark"));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.discard());
    expect(result.current.draft!.app.theme).toBe("system");
    expect(result.current.isDirty).toBe(false);
  });

  it("save refuses on validation error", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.setAppField("currency", "US"));

    let saved: unknown = "not-set";
    await act(async () => {
      saved = await result.current.save();
    });
    expect(saved).toBeNull();
    expect(result.current.status).toBe("error");
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("resetToDefaults restores built-in values", async () => {
    const { result } = renderHook(() => useSettings(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.setAppField("theme", "dark"));
    await act(async () => {
      await result.current.save();
    });

    await act(async () => {
      await result.current.resetToDefaults();
    });

    expect(result.current.draft!.app.theme).toBe("system");
    expect(result.current.isDirty).toBe(false);
  });
});
