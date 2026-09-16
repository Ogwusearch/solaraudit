import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_MISSING_METADATA,
  ERROR_INVALID_ISO_DATE,
  errorMissingMetadataField,
  errorInvalidTraceEntry,
} from "../errors";

const base = {
  metadata: {
    projectName: "Test site",
    reportVersion: "1.0",
    calculationVersion: "0.1.0",
    generatedAtIso: "2026-09-12",
  },
};

describe("validateInput", () => {
  it("accepts a minimal valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects missing metadata", () => {
    expect(validateInput({} as never)).toContain(ERROR_MISSING_METADATA);
  });

  it("rejects missing required metadata fields", () => {
    const errs = validateInput({
      metadata: { ...base.metadata, projectName: "" },
    });
    expect(errs).toContain(errorMissingMetadataField("projectName"));
  });

  it("rejects malformed ISO date", () => {
    const errs = validateInput({
      metadata: { ...base.metadata, generatedAtIso: "not-a-date" },
    });
    expect(errs).toContain(ERROR_INVALID_ISO_DATE);
  });

  it("accepts full ISO 8601 with time and zone", () => {
    const errs = validateInput({
      metadata: { ...base.metadata, generatedAtIso: "2026-09-12T10:30:00Z" },
    });
    expect(errs).toEqual([]);
  });

  it("rejects malformed trace entry", () => {
    const errs = validateInput({
      ...base,
      trace: [{ engine: "", version: "1.0", producedAtIso: "2026-09-12" }],
    });
    expect(errs).toContain(errorInvalidTraceEntry(0));
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      metadata: {
        projectName: "",
        reportVersion: "",
        calculationVersion: "",
        generatedAtIso: "bad",
      },
    });
    expect(errs.length).toBeGreaterThanOrEqual(4);
  });
});
