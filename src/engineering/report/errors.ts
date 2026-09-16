/**
 * SolarAudit — Report Engine: Error & Warning Messages
 */

export const ERROR_MISSING_METADATA =
  "metadata is required.";

export const errorMissingMetadataField = (field: string): string =>
  `metadata.${field} is required.`;

export const ERROR_INVALID_ISO_DATE =
  "metadata.generatedAtIso must be an ISO 8601 date string.";

export const ERROR_INVALID_REPORT_VERSION =
  "metadata.reportVersion must be a non-empty string.";

export const ERROR_INVALID_CALC_VERSION =
  "metadata.calculationVersion must be a non-empty string.";

export const errorInvalidTraceEntry = (idx: number): string =>
  `trace[${idx}] must have engine, version, and producedAtIso.`;

export const WARN_NO_LOAD =
  "No load snapshot provided; load section will be marked missing.";

export const WARN_NO_ENERGY =
  "No energy snapshot provided; energy section will be marked missing.";

export const WARN_NO_SOLAR =
  "No solar snapshot provided; solar section will be marked missing.";

export const WARN_NO_BATTERY =
  "No battery snapshot provided; battery section will be marked missing.";

export const WARN_NO_INVERTER =
  "No inverter snapshot provided; inverter section will be marked missing.";

export const WARN_NO_CONTROLLER =
  "No charge controller snapshot provided; controller section will be marked missing.";

export const WARN_NO_CABLES =
  "No cable snapshots provided; cable section will be marked missing.";

export const WARN_NO_PROTECTION =
  "No protection snapshots provided; protection section will be marked missing.";

export const WARN_NO_BOM =
  "No BOM snapshot provided; BOM section will be marked missing.";

export const WARN_NO_COSTING =
  "No costing snapshot provided; costing section will be marked missing.";

export const WARN_NO_VALIDATION =
  "No validation snapshot provided; validation section will be marked missing.";

export const WARN_NO_TRACE =
  "No traceability entries provided. Report cannot be traced to source engines.";

export const WARN_NO_ASSUMPTIONS =
  "No assumptions recorded. Auditors should document design assumptions.";

export const WARN_VALIDATION_INVALID =
  "Validation status is INVALID. Report cannot be signed off until resolved.";

export const WARN_VALIDATION_WARNING =
  "Validation status is WARNING. Review flagged rules before sign-off.";

export const WARN_MISSING_CORE_SECTIONS = (count: number): string =>
  `${count} core section(s) missing; report is partial.`;
