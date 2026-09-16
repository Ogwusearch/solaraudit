import { describe, it, expect } from "vitest";
import {
  assembleReportInput,
  generateReportFromDraft,
  validateDraft,
} from "../services/reportsService";
import {
  createEmptyDraft,
  createSampleDraft,
  createSampleSnapshot,
} from "../services/reportsFactory";
import type { ProjectSnapshot, ReportsFormDraft } from "../types";

const baseDraft: ReportsFormDraft = {
  projectName: "Home 5 kWp",
  clientName: "Mr. A",
  siteAddress: "12 Bourdillon Rd",
  auditorName: "Auditor",
  reportVersion: "1.0",
  calculationVersion: "0.1.0",
  generatedAtIso: "2026-09-12T10:30:00Z",
  currency: "USD",
  assumptions: [
    { id: "a1", key: "PSH", value: "4.5 h", source: "site survey" },
  ],
};

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags missing project name", () => {
    expect(validateDraft({ ...baseDraft, projectName: "" })["projectName"])
      .toBeDefined();
  });

  it("flags missing report version", () => {
    expect(validateDraft({ ...baseDraft, reportVersion: "" })["reportVersion"])
      .toBeDefined();
  });

  it("flags missing calculation version", () => {
    expect(
      validateDraft({ ...baseDraft, calculationVersion: "" })
        ["calculationVersion"],
    ).toBeDefined();
  });

  it("flags missing report date", () => {
    expect(validateDraft({ ...baseDraft, generatedAtIso: "" })["generatedAtIso"])
      .toBeDefined();
  });

  it("flags missing assumption key", () => {
    const errs = validateDraft({
      ...baseDraft,
      assumptions: [{ id: "a1", key: "", value: "x", source: "" }],
    });
    expect(errs["assumptions.0.key"]).toBeDefined();
  });
});

describe("assembleReportInput", () => {
  it("merges metadata and snapshot into a ReportInput", () => {
    const snapshot = createSampleSnapshot();
    const input = assembleReportInput(baseDraft, snapshot);
    expect(input.metadata.projectName).toBe("Home 5 kWp");
    expect(input.metadata.reportVersion).toBe("1.0");
    expect(input.load).toBeDefined();
    expect(input.solar).toBeDefined();
    expect(input.battery).toBeDefined();
    expect(input.assumptions?.length).toBe(1);
    expect(input.trace?.length).toBeGreaterThan(0);
  });

  it("omits optional snapshot fields when absent", () => {
    const empty: ProjectSnapshot = {};
    const input = assembleReportInput(baseDraft, empty);
    expect(input.load).toBeUndefined();
    expect(input.solar).toBeUndefined();
    expect(input.assumptions?.length).toBe(1);
  });

  it("uppercases currency", () => {
    const input = assembleReportInput(
      { ...baseDraft, currency: "usd" },
      {},
    );
    expect(input.metadata.currency).toBe("USD");
  });

  it("trims whitespace on metadata", () => {
    const input = assembleReportInput(
      { ...baseDraft, projectName: "  Home 5 kWp  " },
      {},
    );
    expect(input.metadata.projectName).toBe("Home 5 kWp");
  });

  it("omits assumptions when all rows are empty", () => {
    const input = assembleReportInput(
      {
        ...baseDraft,
        assumptions: [{ id: "a1", key: "", value: "", source: "" }],
      },
      {},
    );
    expect(input.assumptions).toBeUndefined();
  });

  it("omits optional client/site/auditor when empty", () => {
    const input = assembleReportInput(
      { ...baseDraft, clientName: "", siteAddress: "", auditorName: "" },
      {},
    );
    expect(input.metadata.clientName).toBeUndefined();
    expect(input.metadata.siteAddress).toBeUndefined();
    expect(input.metadata.auditorName).toBeUndefined();
  });

  it("omits empty arrays from the snapshot", () => {
    const input = assembleReportInput(baseDraft, {
      cables: [],
      protections: [],
    });
    expect(input.cables).toBeUndefined();
    expect(input.protections).toBeUndefined();
  });
});

describe("generateReportFromDraft (service → engine)", () => {
  it("returns a valid engine result for a full draft + snapshot", () => {
    const r = generateReportFromDraft(baseDraft, createSampleSnapshot());
    expect(r.isValid).toBe(true);
    expect(r.overallStatus).toBe("complete");
    expect(r.sections.length).toBeGreaterThan(10);
  });

  it("returns partial when core sections are missing", () => {
    const r = generateReportFromDraft(baseDraft, {});
    expect(r.isValid).toBe(true);
    expect(r.overallStatus).toBe("partial");
    expect(r.warnings.some((w) => /core section/i.test(w))).toBe(true);
  });

  it("passes engine errors through unchanged on malformed metadata", () => {
    const r = generateReportFromDraft(
      { ...baseDraft, generatedAtIso: "not-a-date" },
      createSampleSnapshot(),
    );
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("reflects an invalid validation snapshot in the report status", () => {
    const snapshot = createSampleSnapshot();
    const r = generateReportFromDraft(baseDraft, {
      ...snapshot,
      validation: {
        overallStatus: "invalid",
        errorCount: 2,
        warningCount: 0,
        infoCount: 0,
      },
    });
    expect(r.overallStatus).toBe("invalid");
  });

  it("includes assumptions in the report sections", () => {
    const r = generateReportFromDraft(baseDraft, createSampleSnapshot());
    const assumptions = r.sections.find((s) => s.key === "assumptions");
    expect(assumptions?.status).toBe("complete");
    expect(assumptions?.body.length).toBe(1);
  });
});

describe("factory samples", () => {
  it("empty draft is valid (form has defaults)", () => {
    const d = createEmptyDraft();
    expect(d.reportVersion).toBe("1.0");
    expect(d.assumptions.length).toBe(1);
  });

  it("sample draft passes form validation", () => {
    expect(validateDraft(createSampleDraft())).toEqual({});
  });

  it("sample snapshot populates every core section", () => {
    const s = createSampleSnapshot();
    expect(s.load).toBeDefined();
    expect(s.energy).toBeDefined();
    expect(s.solar).toBeDefined();
    expect(s.battery).toBeDefined();
    expect(s.inverter).toBeDefined();
  });
});
