import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBatterySizing } from "../hooks/useBatterySizing";

describe("useBatterySizing", () => {
  it("starts idle with an empty draft", () => {
    const { result } = renderHook(() => useBatterySizing());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.systemVoltage).toBe("48");
    expect(result.current.draft.cell.technology).toBe("lifepo4");
  });

  it("updates top-level fields", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.setField("autonomyDays", "2"));
    expect(result.current.draft.autonomyDays).toBe("2");
    expect(result.current.status).toBe("editing");
  });

  it("updates cell fields", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.setCellField("technology", "agm"));
    expect(result.current.draft.cell.technology).toBe("agm");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.loadSample());
    expect(result.current.draft.cell.name).toBe("LFP 12 V 100 Ah");
    expect(result.current.draft.dailyEnergyKwh).toBe("10");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.bankVoltage).toBe(48);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useBatterySizing());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;

    act(() => result.current.setField("autonomyDays", "2"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
