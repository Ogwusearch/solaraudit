import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useProtectionSizing } from "../hooks/useProtectionSizing";

describe("useProtectionSizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useProtectionSizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.role).toBe("battery");
    expect(result.current.draft.voltageType).toBe("dc");
    expect(result.current.draft.technology).toBe("fuse");
  });

  it("updates fields", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.setField("continuousCurrentA", "80"));
    expect(result.current.draft.continuousCurrentA).toBe("80");
    expect(result.current.status).toBe("editing");
  });

  it("updates selects", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.setField("role", "pv-string"));
    expect(result.current.draft.role).toBe("pv-string");

    act(() => result.current.setField("technology", "fuse"));
    expect(result.current.draft.technology).toBe("fuse");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.continuousCurrentA).toBe("100");
    expect(result.current.draft.systemVoltageV).toBe("48");
    expect(result.current.draft.technology).toBe("dc-breaker");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.recommendedRatingA).toBeGreaterThan(0);
  });

  it("marks status as error when engine flags under-rated device", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.loadSample());
    act(() => result.current.setField("deviceCurrentRatingA", "50"));
    act(() => result.current.calculate());

    expect(result.current.status).toBe("error");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(false);
    expect(result.current.view!.result.currentRatingSufficient).toBe(false);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useProtectionSizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });
});
