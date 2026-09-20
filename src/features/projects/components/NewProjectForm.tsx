
/**
 * SolarAudit — Projects feature: New project form
 *
 * Presentational component.
 * No domain logic.
 * No persistence.
 */

import { useState, type FormEvent } from "react";
import type { FormValidationErrors, ProjectDraft } from "../types";

export interface NewProjectFormProps {
  readonly initialDraft: ProjectDraft;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onSubmit: (draft: ProjectDraft) => void | Promise<void>;
  readonly onLoadSample?: () => void;
}

export function NewProjectForm({
  initialDraft,
  errors,
  disabled = false,
  onSubmit,
  onLoadSample,
}: NewProjectFormProps) {
  const [draft, setDraft] = useState<ProjectDraft>(initialDraft);

  const set = <K extends keyof ProjectDraft>(
    key: K,
    value: ProjectDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
            onChange={(event) => set("name", event.target.value)}
            placeholder="e.g. Off-grid home — Lagos"
            required
          />
          {errors.name && (
            <span role="alert">
              {errors.name}
            </span>
          )}
        </label>

        <label>
          Client name
          <input
            type="text"
            value={draft.clientName}
            onChange={(event) => set("clientName", event.target.value)}
          />
          {errors.clientName && (
            <span role="alert">
              {errors.clientName}
            </span>
          )}
        </label>

        <label>
          Site address
          <input
            type="text"
            value={draft.siteAddress}
            onChange={(event) => set("siteAddress", event.target.value)}
          />
          {errors.siteAddress && (
            <span role="alert">
              {errors.siteAddress}
            </span>
          )}
        </label>

        <label>
          Auditor
          <input
            type="text"
            value={draft.auditorName}
            onChange={(event) => set("auditorName", event.target.value)}
          />
          {errors.auditorName && (
            <span role="alert">
              {errors.auditorName}
            </span>
          )}
        </label>

        <label>
          Notes
          <textarea
            value={draft.notes}
            onChange={(event) => set("notes", event.target.value)}
            rows={3}
          />
        </label>

        <div>
          <button type="submit" disabled={disabled}>
            Create project
          </button>

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
