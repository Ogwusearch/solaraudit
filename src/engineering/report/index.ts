/**
 * SolarAudit — Report Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * The Report Engine assembles the structured engineering report
 * document from the outputs of every other engine. It does NOT render
 * PDF, HTML, or markdown — a presentation layer consumes the result.
 *
 *   isValid       : structural — did the input parse?
 *   overallStatus : document — complete / partial / invalid
 */

import type { ReportInput, ReportResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function generateReport(input: ReportInput): ReportResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      title: "",
      metadata: input.metadata,
      summary: {},
      sections: [],
      sectionCount: 0,
      overallStatus: "invalid",
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
