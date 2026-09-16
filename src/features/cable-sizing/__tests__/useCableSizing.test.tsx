import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCableSizing } from "../hooks/useCableSizing";

describe("useCableSizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useCableSizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.systemVoltage).toBe("48");
    expect(result.current.draft.material).toBe("copper");
    expect(result.current.draft.circuitType).toBe("dc");
  });

  it("updates fields", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.setField("currentA", "60"));
    expect(result.current.draft.currentA).toBe("60");
    expect(result.current.status).toBe("editing");
  });

  it("updates select fields", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.setField("material", "aluminium"));
    expect(result.current.draft.material).toBe("aluminium");

    act(() => result.current.setField("circuitType", "ac-three-phase"));
    expect(result.current.draft.circuitType).toBe("ac-three-phase");

    act(() => result.current.setField("installationMethod", "buried"));
    expect(result.current.draft.installationMethod).toBe("buried");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.currentA).toBe("40");
    expect(result.current.draft.lengthM).toBe("20");
    expect(result.current.draft.ambientTemperatureC).toBe("30");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.selectedAreaMm2).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useCableSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;

    act(() => result.current.setField("currentA", "50"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
