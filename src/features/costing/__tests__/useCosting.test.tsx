import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCosting } from "../hooks/useCosting";

describe("useCosting", () => {
  it("starts idle with a single empty line item", () => {
    const { result } = renderHook(() => useCosting());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.items.length).toBe(1);
    expect(result.current.draft.currency).toBe("USD");
  });

  it("adds and removes line items", () => {
    const { result } = renderHook(() => useCosting());

    act(() => result.current.addItem());
    expect(result.current.draft.items.length).toBe(2);

    const id = result.current.draft.items[0]!.id;
    act(() => result.current.removeItem(id));
    expect(result.current.draft.items.length).toBe(1);
  });

  it("updates top-level fields", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.setTopField("currency", "NGN"));
    expect(result.current.draft.currency).toBe("NGN");

    act(() => result.current.setTopField("taxPercent", "7.5"));
    expect(result.current.draft.taxPercent).toBe("7.5");
  });

  it("updates line item fields by id", () => {
    const { result } = renderHook(() => useCosting());
    const id = result.current.draft.items[0]!.id;

    act(() => {
      result.current.setItemField(id, "description", "Panel");
      result.current.setItemField(id, "quantity", "10");
      result.current.setItemField(id, "unitCost", "180");
    });

    const item = result.current.draft.items[0]!;
    expect(item.description).toBe("Panel");
    expect(item.quantity).toBe("10");
    expect(item.unitCost).toBe("180");
  });

  it("updates overhead fields", () => {
    const { result } = renderHook(() => useCosting());
    act(() =>
      result.current.setOverheadField("installationPercent", "15"),
    );
    expect(result.current.draft.overheads.installationPercent).toBe("15");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.loadSample());
    expect(result.current.draft.items.length).toBeGreaterThan(3);
    expect(result.current.draft.taxPercent).toBe("7.5");
  });

  it("refuses to calculate when the form is invalid", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully after loading the sample", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.grandTotal).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.items.length).toBe(1);
  });

  it("editing after a calculation preserves the previous view", () => {
    const { result } = renderHook(() => useCosting());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    const prev = result.current.view;

    act(() => result.current.setTopField("taxPercent", "10"));
    expect(result.current.status).toBe("editing");
    expect(result.current.view).toBe(prev);
  });
});
