/**
 * SolarAudit — Report Engine: Validation
 *
 * Structural validation of the ReportInput. Collects ALL errors.
 * Never throws. Returns string[] (empty == valid).
 */

import type { ReportInput } from "./types";
import {
  ERROR_MISSING_METADATA,
  errorMissingMetadataField,
  ERROR_INVALID_ISO_DATE,
  ERROR_INVALID_REPORT_VERSION,
  ERROR_INVALID_CALC_VERSION,
  errorInvalidTraceEntry,
} from "./errors";
import { REQUIRED_METADATA_FIELDS } from "./constants";

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function validateInput(input: ReportInput): string[] {
  const errors: string[] = [];

  if (!input.metadata) {
    errors.push(ERROR_MISSING_METADATA);
    return errors;
  }

  const m = input.metadata;

  for (const field of REQUIRED_METADATA_FIELDS) {
    const value = (m as unknown as Record<string, unknown>)[field];
    if (value === undefined || value === null || value === "") {
      errors.push(errorMissingMetadataField(field));
    }
  }

  if (m.reportVersion !== undefined && typeof m.reportVersion !== "string") {
    errors.push(ERROR_INVALID_REPORT_VERSION);
  }
  if (
    m.calculationVersion !== undefined &&
    typeof m.calculationVersion !== "string"
  ) {
    errors.push(ERROR_INVALID_CALC_VERSION);
  }
  if (
    m.generatedAtIso !== undefined &&
    !ISO_DATE_PATTERN.test(m.generatedAtIso)
  ) {
    errors.push(ERROR_INVALID_ISO_DATE);
  }

  input.trace?.forEach((t, idx) => {
    if (!t.engine || !t.version || !t.producedAtIso) {
      errors.push(errorInvalidTraceEntry(idx));
    }
  });

  return errors;
}
