import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLoadAudit } from "../hooks/useLoadAudit";

describe("useLoadAudit", () => {
  it("starts in idle status with an empty draft", () => {
    const { result } = renderHook(() => useLoadAudit());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("adds and removes rows", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.addRow());
    expect(result.current.draft.appliances.length).toBe(2);

    const id = result.current.draft.appliances[0]!.id;
    act(() => result.current.removeRow(id));
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("updates a row's fields", () => {
    const { result } = renderHook(() => useLoadAudit());
    const id = result.current.draft.appliances[0]!.id;

    act(() => {
      result.current.setName(id, "Fridge");
      result.current.setPower(id, "150");
      result.current.setHours(id, "24");
      result.current.setQuantity(id, "1");
    });

    const row = result.current.draft.appliances[0]!;
    expect(row.name).toBe("Fridge");
    expect(row.powerWatts).toBe("150");
    expect(row.hoursPerDay).toBe("24");
    expect(row.quantity).toBe("1");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useLoadAudit());
    act(() => result.current.loadSample());
    expect(result.current.draft.appliances.length).toBeGreaterThan(1);
    expect(result.current.status).toBe("editing");
  });

  it("does not calculate when form is invalid", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.calculate());

    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully on a valid draft", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.totalDailyEnergyKwh).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("does not implement engineering math itself", () => {
    // The hook's job is orchestration, not computation. Verify that
    // changing only a UI concern (adding a row) does not compute a
    // result — status becomes "editing", not "calculated".
    const { result } = renderHook(() => useLoadAudit());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("calculated");

    act(() => result.current.addRow());
    expect(result.current.status).toBe("editing");
    expect(result.current.view).not.toBeNull(); // previous result preserved
  });
});
