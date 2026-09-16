/**
 * SolarAudit — Reports feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 *
 * Responsibilities:
 *   - Compile the user-editable draft + the read-only project snapshot
 *     into the Report Engine's typed ReportInput
 *   - Call the engine
 *   - Return the engine result to the caller
 *
 * NOT responsible for:
 *   - Fetching project state (that is a future project-state service)
 *   - Rendering
 *   - Persistence
 *   - Engineering math (the Report Engine is itself pure assembly)
 */

import { generateReport } from "../../../engineering/report";
import type {
  ReportAssumption,
  ReportInput,
  ReportMetadata,
  ReportResult,
  TraceEntry,
} from "../../../engineering/report";
import type {
  AssumptionDraft,
  FormValidationErrors,
  ProjectSnapshot,
  ReportsFormDraft,
} from "../types";

/**
 * Assemble the engine's ReportInput from the draft and the snapshot.
 * Pure mapping — no engineering decisions, no derivation of values.
 */
export function assembleReportInput(
  draft: ReportsFormDraft,
  snapshot: ProjectSnapshot,
): ReportInput {
  const metadata: ReportMetadata = {
    projectName: draft.projectName.trim(),
    clientName: draft.clientName.trim() || undefined,
    siteAddress: draft.siteAddress.trim() || undefined,
    auditorName: draft.auditorName.trim() || undefined,
    reportVersion: draft.reportVersion.trim(),
    calculationVersion: draft.calculationVersion.trim(),
    generatedAtIso: draft.generatedAtIso.trim(),
    currency: draft.currency.trim().toUpperCase() || undefined,
  };

  const assumptions: ReportAssumption[] = draft.assumptions
    .filter((a) => a.key.trim() !== "")
    .map((a) => {
      const source = a.source.trim();
      return source === ""
        ? { key: a.key.trim(), value: a.value.trim() }
        : { key: a.key.trim(), value: a.value.trim(), source };
    });

  const trace: readonly TraceEntry[] = snapshot.trace ?? [];

  // Merge: base ReportInput object, then spread snapshot fields only
  // when they are present. This keeps the engine's optional-field
  // semantics intact (an absent field stays absent, not undefined-typed).
  return {
    metadata,
    ...(assumptions.length > 0 ? { assumptions } : {}),
    ...(trace.length > 0 ? { trace } : {}),
    ...(snapshot.load ? { load: snapshot.load } : {}),
    ...(snapshot.energy ? { energy: snapshot.energy } : {}),
    ...(snapshot.solar ? { solar: snapshot.solar } : {}),
    ...(snapshot.battery ? { battery: snapshot.battery } : {}),
    ...(snapshot.inverter ? { inverter: snapshot.inverter } : {}),
    ...(snapshot.chargeController
      ? { chargeController: snapshot.chargeController }
      : {}),
    ...(snapshot.cables && snapshot.cables.length > 0
      ? { cables: snapshot.cables }
      : {}),
    ...(snapshot.protections && snapshot.protections.length > 0
      ? { protections: snapshot.protections }
      : {}),
    ...(snapshot.bom ? { bom: snapshot.bom } : {}),
    ...(snapshot.costing ? { costing: snapshot.costing } : {}),
    ...(snapshot.validation ? { validation: snapshot.validation } : {}),
  };
}

/**
 * Form-level validation. The engine validates metadata shape and trace
 * entries itself; this catches the missing-field class early.
 */
export function validateDraft(
  draft: ReportsFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  if (draft.projectName.trim() === "") {
    errors["projectName"] = "Project name is required.";
  }
  if (draft.reportVersion.trim() === "") {
    errors["reportVersion"] = "Report version is required.";
  }
  if (draft.calculationVersion.trim() === "") {
    errors["calculationVersion"] = "Calculation version is required.";
  }
  if (draft.generatedAtIso.trim() === "") {
    errors["generatedAtIso"] = "Report date is required.";
  }

  draft.assumptions.forEach((a, idx) => {
    if (a.key.trim() === "") {
      errors[`assumptions.${idx}.key`] = "Key is required.";
    }
  });

  return errors;
}

/**
 * Generate the report. Feature's public entry point.
 */
export function generateReportFromDraft(
  draft: ReportsFormDraft,
  snapshot: ProjectSnapshot,
): ReportResult {
  const input = assembleReportInput(draft, snapshot);
  return generateReport(input);
}
