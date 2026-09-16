import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEnergyAnalysis } from "../hooks/useEnergyAnalysis";

describe("useEnergyAnalysis", () => {
  it("starts idle with a single empty PV array", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.pvArrays.length).toBe(1);
    expect(result.current.draft.includeBattery).toBe(false);
  });

  it("adds and removes PV arrays", () => {
    const { result } = renderHook(() => useEnergyAnalysis());

    act(() => result.current.addPvArray());
    expect(result.current.draft.pvArrays.length).toBe(2);

    act(() => result.current.removePvArray(0));
    expect(result.current.draft.pvArrays.length).toBe(1);
  });

  it("updates top-level fields", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.setTopField("dailyConsumptionKwh", "12"));
    expect(result.current.draft.dailyConsumptionKwh).toBe("12");
  });

  it("toggles the battery section", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.setTopField("includeBattery", true));
    expect(result.current.draft.includeBattery).toBe(true);
  });

  it("updates battery fields", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.setBatteryField("capacityKwh", "15"));
    expect(result.current.draft.battery.capacityKwh).toBe("15");
  });

  it("updates PV array fields", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.setPvField(0, "capacityKwp", "6"));
    expect(result.current.draft.pvArrays[0]!.capacityKwp).toBe("6");
  });

  it("loads a sample draft with battery enabled", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.loadSample());
    expect(result.current.draft.includeBattery).toBe(true);
    expect(result.current.draft.pvArrays[0]!.capacityKwp).toBe("5");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useEnergyAnalysis());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.includeBattery).toBe(false);
  });
});
