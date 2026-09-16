/**
 * SolarAudit — Reports feature: Metadata form
 *
 * Project / client / version / date / currency. Presentational.
 */

import type { FormValidationErrors } from "../types";

export interface ReportMetadataFormProps {
  readonly projectName: string;
  readonly clientName: string;
  readonly siteAddress: string;
  readonly auditorName: string;
  readonly reportVersion: string;
  readonly calculationVersion: string;
  readonly generatedAtIso: string;
  readonly currency: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function ReportMetadataForm(props: ReportMetadataFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <>
      <fieldset disabled={disabled}>
        <legend>Project</legend>

        <label>
          Project name
          <input
            type="text"
            value={props.projectName}
            onChange={(e) => onField("projectName", e.target.value)}
          />
          {errors["projectName"] && (
            <span role="alert">{errors["projectName"]}</span>
          )}
        </label>

        <label>
          Client
          <input
            type="text"
            value={props.clientName}
            onChange={(e) => onField("clientName", e.target.value)}
          />
        </label>

        <label>
          Site
          <input
            type="text"
            value={props.siteAddress}
            onChange={(e) => onField("siteAddress", e.target.value)}
          />
        </label>

        <label>
          Auditor
          <input
            type="text"
            value={props.auditorName}
            onChange={(e) => onField("auditorName", e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Report</legend>

        <label>
          Report version
          <input
            type="text"
            value={props.reportVersion}
            onChange={(e) => onField("reportVersion", e.target.value)}
          />
          {errors["reportVersion"] && (
            <span role="alert">{errors["reportVersion"]}</span>
          )}
        </label>

        <label>
          Calculation version
          <input
            type="text"
            value={props.calculationVersion}
            onChange={(e) => onField("calculationVersion", e.target.value)}
          />
          {errors["calculationVersion"] && (
            <span role="alert">{errors["calculationVersion"]}</span>
          )}
        </label>

        <label>
          Report date (ISO 8601)
          <input
            type="text"
            value={props.generatedAtIso}
            onChange={(e) => onField("generatedAtIso", e.target.value)}
            placeholder="2026-09-12T10:30:00Z"
          />
          {errors["generatedAtIso"] && (
            <span role="alert">{errors["generatedAtIso"]}</span>
          )}
        </label>

        <label>
          Currency
          <input
            type="text"
            maxLength={3}
            value={props.currency}
            onChange={(e) => onField("currency", e.target.value)}
            placeholder="USD"
          />
        </label>
      </fieldset>
    </>
  );
}
