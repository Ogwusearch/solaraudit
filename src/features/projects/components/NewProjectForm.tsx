/**
 * SolarAudit — Projects feature: New project form
 *
 * Presentational. No domain logic, no persistence.
 */

import { useState } from "react";
import type { FormValidationErrors, ProjectDraft } from "../types";

export interface NewProjectFormProps {
  readonly initialDraft: ProjectDraft;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onSubmit: (draft: ProjectDraft) => void | Promise<void>;
  readonly onLoadSample?: () => void;
}

export function NewProjectForm(props: NewProjectFormProps) {
  const { initialDraft, errors, disabled, onSubmit, onLoadSample } = props;
  const [draft, setDraft] = useState<ProjectDraft>(initialDraft);

  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(draft);
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={disabled}>
        <legend>New project</legend>

        <label>
          Project name
          <input
            type="text"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Off-grid home — Lagos"
            required
          />
          {errors["name"] && <span role="alert">{errors["name"]}</span>}
        </label>

        <label>
          Client name
          <input
            type="text"
            value={draft.clientName}
            onChange={(e) => set("clientName", e.target.value)}
          />
          {errors["clientName"] && (
            <span role="alert">{errors["clientName"]}</span>
          )}
        </label>

        <label>
          Site address
          <input
            type="text"
            value={draft.siteAddress}
            onChange={(e) => set("siteAddress", e.target.value)}
          />
          {errors["siteAddress"] && (
            <span role="alert">{errors["siteAddress"]}</span>
          )}
        </label>

        <label>
          Auditor
          <input
            type="text"
            value={draft.auditorName}
            onChange={(e) => set("auditorName", e.target.value)}
          />
          {errors["auditorName"] && (
            <span role="alert">{errors["auditorName"]}</span>
          )}
        </label>

        <label>
          Notes
          <textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
          />
        </label>

        <div>
          <button type="submit">Create project</button>
          {onLoadSample && (
            <button type="button" onClick={onLoadSample}>
              Load sample
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
