import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVoltageDrop } from "../hooks/useVoltageDrop";

describe("useVoltageDrop", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useVoltageDrop());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.material).toBe("copper");
    expect(result.current.draft.circuitType).toBe("dc");
    expect(result.current.draft.targetDropPercent).toBe("3");
  });

  it("updates fields", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.setField("currentA", "60"));
    expect(result.current.draft.currentA).toBe("60");
    expect(result.current.status).toBe("editing");
  });

  it("updates selects", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.setField("material", "aluminium"));
    expect(result.current.draft.material).toBe("aluminium");

    act(() => result.current.setField("circuitType", "ac-three-phase"));
    expect(result.current.draft.circuitType).toBe("ac-three-phase");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.loadSample());
    expect(result.current.draft.currentA).toBe("40");
    expect(result.current.draft.conductorAreaMm2).toBe("25");
    expect(result.current.draft.targetDropPercent).toBe("3");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.voltageDropV).toBeGreaterThan(0);
  });

  it("works in inverse-only mode", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => {
      result.current.setField("currentA", "40");
      result.current.setField("lengthM", "20");
      result.current.setField("systemVoltageV", "48");
      result.current.setField("targetDropPercent", "2");
    });
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view!.result.calculatedMinAreaMm2).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useVoltageDrop());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;

    act(() => result.current.setField("currentA", "50"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
