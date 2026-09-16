import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useReports } from "../hooks/useReports";
import { createSampleSnapshot } from "../services/reportsFactory";

describe("useReports", () => {
  it("starts idle with an empty draft and empty snapshot", () => {
    const { result } = renderHook(() => useReports());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.projectName).toBe("");
    expect(result.current.draft.assumptions.length).toBe(1);
    expect(result.current.snapshot).toEqual({});
  });

  it("updates metadata fields", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.setMetadataField("projectName", "Site A"));
    expect(result.current.draft.projectName).toBe("Site A");
    expect(result.current.status).toBe("editing");
  });

  it("updates assumption fields by id", () => {
    const { result } = renderHook(() => useReports());
    const id = result.current.draft.assumptions[0]!.id;

    act(() => {
      result.current.setAssumptionField(id, "key", "PSH");
      result.current.setAssumptionField(id, "value", "4.5 h");
      result.current.setAssumptionField(id, "source", "site survey");
    });

    const a = result.current.draft.assumptions[0]!;
    expect(a.key).toBe("PSH");
    expect(a.value).toBe("4.5 h");
    expect(a.source).toBe("site survey");
  });

  it("adds and removes assumptions", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.addAssumption());
    expect(result.current.draft.assumptions.length).toBe(2);

    const id = result.current.draft.assumptions[0]!.id;
    act(() => result.current.removeAssumption(id));
    expect(result.current.draft.assumptions.length).toBe(1);
  });

  it("accepts a snapshot via setSnapshot", () => {
    const { result } = renderHook(() => useReports());
    const s = createSampleSnapshot();
    act(() => result.current.setSnapshot(s));
    expect(result.current.snapshot.load).toBeDefined();
    expect(result.current.snapshot.solar).toBeDefined();
  });

  it("loads sample draft + snapshot", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.loadSample());
    expect(result.current.draft.projectName).toBeTruthy();
    expect(result.current.draft.assumptions.length).toBeGreaterThan(1);
    expect(result.current.snapshot.load).toBeDefined();
    expect(result.current.status).toBe("editing");
  });

  it("refuses to generate when the form is invalid", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.generate());
    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("generates a report successfully after loading the sample", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.loadSample());
    act(() => result.current.generate());

    expect(result.current.status).toBe("generated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.sections.length).toBeGreaterThan(10);
  });

  it("generates a partial report when the snapshot is empty", () => {
    const { result } = renderHook(() => useReports());
    act(() =>
      result.current.setMetadataField("projectName", "Minimal"),
    );
    act(() => result.current.generate());

    expect(result.current.status).toBe("generated");
    expect(result.current.view!.result.overallStatus).toBe("partial");
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useReports());
    act(() => result.current.loadSample());
    act(() => result.current.generate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.snapshot).toEqual({});
  });
});
