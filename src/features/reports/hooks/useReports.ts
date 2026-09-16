/**
 * SolarAudit — Reports feature: Hook
 *
 * Owns the draft (user-editable metadata + assumptions) and the
 * snapshot (read-only project state). Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  AssumptionDraft,
  FormValidationErrors,
  ProjectSnapshot,
  ReportsFormDraft,
  ReportsStatus,
  ReportsView,
} from "../types";
import {
  generateReportFromDraft,
  validateDraft,
} from "../services/reportsService";
import {
  appendAssumption,
  createEmptyDraft,
  createEmptySnapshot,
  createSampleDraft,
  createSampleSnapshot,
} from "../services/reportsFactory";

type MetadataField = Exclude<keyof ReportsFormDraft, "assumptions">;

export interface UseReportsReturn {
  readonly draft: ReportsFormDraft;
  readonly snapshot: ProjectSnapshot;
  readonly status: ReportsStatus;
  readonly view: ReportsView | null;
  readonly formErrors: FormValidationErrors;

  readonly setMetadataField: (field: MetadataField, value: string) => void;
  readonly setAssumptionField: (
    id: string,
    field: keyof Omit<AssumptionDraft, "id">,
    value: string,
  ) => void;
  readonly addAssumption: () => void;
  readonly removeAssumption: (id: string) => void;

  /** Populate the read-only snapshot from project state. */
  readonly setSnapshot: (snapshot: ProjectSnapshot) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly generate: () => void;
}

export function useReports(
  initialDraft: ReportsFormDraft = createEmptyDraft(),
  initialSnapshot: ProjectSnapshot = createEmptySnapshot(),
): UseReportsReturn {
  const [draft, setDraft] = useState<ReportsFormDraft>(initialDraft);
  const [snapshot, setSnapshotState] =
    useState<ProjectSnapshot>(initialSnapshot);
  const [status, setStatus] = useState<ReportsStatus>("idle");
  const [view, setView] = useState<ReportsView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setMetadataField = useCallback(
    (field: MetadataField, value: string) => {
      setDraft((d) => ({ ...d, [field]: value }));
      setStatus("editing");
    },
    [],
  );

  const setAssumptionField = useCallback(
    (
      id: string,
      field: keyof Omit<AssumptionDraft, "id">,
      value: string,
    ) => {
      setDraft((d) => ({
        ...d,
        assumptions: d.assumptions.map((a) =>
          a.id === id ? { ...a, [field]: value } : a,
        ),
      }));
      setStatus("editing");
    },
    [],
  );

  const addAssumption = useCallback(() => {
    setDraft((d) => ({
      ...d,
      assumptions: appendAssumption(d.assumptions),
    }));
    setStatus("editing");
  }, []);

  const removeAssumption = useCallback((id: string) => {
    setDraft((d) => ({
      ...d,
      assumptions: d.assumptions.filter((a) => a.id !== id),
    }));
    setStatus("editing");
  }, []);

  const setSnapshot = useCallback((s: ProjectSnapshot) => {
    setSnapshotState(s);
    setStatus("editing");
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
    setSnapshotState(createEmptySnapshot());
    setView(null);
    setStatus("idle");
    setTouched(false);
  }, []);

  const loadSample = useCallback(() => {
    setDraft(createSampleDraft());
    setSnapshotState(createSampleSnapshot());
    setView(null);
    setStatus("editing");
  }, []);

  const generate = useCallback(() => {
    setTouched(true);

    const errors = validateDraft(draft);
    if (Object.keys(errors).length > 0) {
      setStatus("error");
      return;
    }

    setStatus("generating");

    const result = generateReportFromDraft(draft, snapshot);

    setView({
      result,
      generatedAt: new Date().toISOString(),
    });

    setStatus(result.isValid ? "generated" : "error");
  }, [draft, snapshot]);

  return {
    draft,
    snapshot,
    status,
    view,
    formErrors,
    setMetadataField,
    setAssumptionField,
    addAssumption,
    removeAssumption,
    setSnapshot,
    reset,
    loadSample,
    generate,
  };
}
