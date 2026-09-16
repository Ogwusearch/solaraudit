/**
 * SolarAudit — Load Audit feature: Hook
 *
 * Owns the feature's editing state and exposes actions the UI binds to.
 * The hook calls the service; it does NOT call the engineering engine.
 *
 * React-specific logic (useState, useCallback) lives here, not in the
 * service or the components.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  ApplianceRowDraft,
  FormValidationErrors,
  LoadAuditFormDraft,
  LoadAuditStatus,
  LoadAuditView,
} from "../types";
import {
  calculateLoadAudit,
  validateDraft,
} from "../services/loadAuditService";
import {
  createEmptyDraft,
  createEmptyRow,
  createSampleDraft,
} from "../services/loadAuditFactory";

export interface UseLoadAuditReturn {
  readonly draft: LoadAuditFormDraft;
  readonly status: LoadAuditStatus;
  readonly view: LoadAuditView | null;
  readonly formErrors: FormValidationErrors;

  readonly setName: (id: string, name: string) => void;
  readonly setPower: (id: string, value: string) => void;
  readonly setHours: (id: string, value: string) => void;
  readonly setQuantity: (id: string, value: string) => void;
  readonly setEssential: (id: string, value: boolean) => void;

  readonly addRow: () => void;
  readonly removeRow: (id: string) => void;

  readonly setDiversityFactor: (value: string) => void;
  readonly setSafetyMargin: (value: string) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useLoadAudit(
  initialDraft: LoadAuditFormDraft = createEmptyDraft(),
): UseLoadAuditReturn {
  const [draft, setDraft] = useState<LoadAuditFormDraft>(initialDraft);
  const [status, setStatus] = useState<LoadAuditStatus>("idle");
  const [view, setView] = useState<LoadAuditView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<ApplianceRowDraft>) => {
      setDraft((d) => ({
        ...d,
        appliances: d.appliances.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      }));
      setStatus("editing");
    },
    [],
  );

  const setName = useCallback(
    (id: string, name: string) => updateRow(id, { name }),
    [updateRow],
  );
  const setPower = useCallback(
    (id: string, value: string) => updateRow(id, { powerWatts: value }),
    [updateRow],
  );
  const setHours = useCallback(
    (id: string, value: string) => updateRow(id, { hoursPerDay: value }),
    [updateRow],
  );
  const setQuantity = useCallback(
    (id: string, value: string) => updateRow(id, { quantity: value }),
    [updateRow],
  );
  const setEssential = useCallback(
    (id: string, value: boolean) => updateRow(id, { essential: value }),
    [updateRow],
  );

  const addRow = useCallback(() => {
    setDraft((d) => ({
      ...d,
      appliances: [...d.appliances, createEmptyRow()],
    }));
    setStatus("editing");
  }, []);

  const removeRow = useCallback((id: string) => {
    setDraft((d) => ({
      ...d,
      appliances: d.appliances.filter((r) => r.id !== id),
    }));
    setStatus("editing");
  }, []);

  const setDiversityFactor = useCallback((value: string) => {
    setDraft((d) => ({ ...d, diversityFactor: value }));
    setStatus("editing");
  }, []);

  const setSafetyMargin = useCallback((value: string) => {
    setDraft((d) => ({ ...d, safetyMargin: value }));
    setStatus("editing");
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
    setView(null);
    setStatus("idle");
    setTouched(false);
  }, []);

  const loadSample = useCallback(() => {
    setDraft(createSampleDraft());
    setView(null);
    setStatus("editing");
  }, []);

  const calculate = useCallback(() => {
    setTouched(true);

    const errors = validateDraft(draft);
    if (Object.keys(errors).length > 0) {
      setStatus("error");
      return;
    }

    setStatus("calculating");

    // Service call — the only place the feature touches the engine.
    const result = calculateLoadAudit(draft);

    setView({
      result,
      calculatedAt: new Date().toISOString(),
    });

    setStatus(result.isValid ? "calculated" : "error");
  }, [draft]);

  return {
    draft,
    status,
    view,
    formErrors,
    setName,
    setPower,
    setHours,
    setQuantity,
    setEssential,
    addRow,
    removeRow,
    setDiversityFactor,
    setSafetyMargin,
    reset,
    loadSample,
    calculate,
  };
}
