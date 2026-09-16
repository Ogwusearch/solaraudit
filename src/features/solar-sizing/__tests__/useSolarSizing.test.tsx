import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSolarSizing } from "../hooks/useSolarSizing";

describe("useSolarSizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useSolarSizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.peakSunHours).toBe("4.5");
  });

  it("updates top-level fields", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.setField("dailyEnergyKwh", "20"));
    expect(result.current.draft.dailyEnergyKwh).toBe("20");
    expect(result.current.status).toBe("editing");
  });

  it("updates panel fields", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.setPanelField("ratedPowerWatts", "450"));
    expect(result.current.draft.panel.ratedPowerWatts).toBe("450");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.panel.ratedPowerWatts).toBe("400");
    expect(result.current.status).toBe("editing");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.actualArrayKwp).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useSolarSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;
    expect(prev).not.toBeNull();

    act(() => result.current.setField("dailyEnergyKwh", "18"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
