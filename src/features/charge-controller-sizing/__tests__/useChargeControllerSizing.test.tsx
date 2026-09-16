import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useChargeControllerSizing } from "../hooks/useChargeControllerSizing";

describe("useChargeControllerSizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.batteryVoltage).toBe("48");
    expect(result.current.draft.technology).toBe("mppt");
  });

  it("updates fields", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.setField("pvArrayKwp", "6"));
    expect(result.current.draft.pvArrayKwp).toBe("6");
    expect(result.current.status).toBe("editing");
  });

  it("updates the technology select", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.setField("technology", "pwm"));
    expect(result.current.draft.technology).toBe("pwm");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.pvArrayKwp).toBe("5");
    expect(result.current.draft.pvVoc).toBe("164");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
  });

  it("marks status as error when engine flags incompatibility", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.loadSample());
    act(() => result.current.setField("maxOutputCurrentA", "50"));
    act(() => result.current.calculate());

    // Structural form is fine, engine still returns isValid:false
    expect(result.current.status).toBe("error");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(false);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useChargeControllerSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });
});
