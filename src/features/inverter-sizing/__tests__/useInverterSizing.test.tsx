import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInverterSizing } from "../hooks/useInverterSizing";

describe("useInverterSizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useInverterSizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.systemVoltage).toBe("48");
    expect(result.current.draft.type).toBe("pure-sine");
    expect(result.current.draft.topology).toBe("off-grid");
  });

  it("updates fields", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.setField("continuousLoadW", "4000"));
    expect(result.current.draft.continuousLoadW).toBe("4000");
    expect(result.current.status).toBe("editing");
  });

  it("updates classification fields", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.setField("topology", "hybrid"));
    expect(result.current.draft.topology).toBe("hybrid");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.continuousLoadW).toBe("3000");
    expect(result.current.draft.peakLoadW).toBe("5000");
    expect(result.current.draft.surgeLoadW).toBe("8000");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.recommendedInverterVa).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useInverterSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;

    act(() => result.current.setField("continuousLoadW", "3500"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
