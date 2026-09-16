/**
 * SolarAudit — Battery Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  BatterySizingFormDraft,
  BatterySizingStatus,
  BatterySizingView,
  CellSpecDraft,
  FormValidationErrors,
} from "../types";
import {
  calculateBatterySizing,
  validateDraft,
} from "../services/batterySizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/batterySizingFactory";

export interface UseBatterySizingReturn {
  readonly draft: BatterySizingFormDraft;
  readonly status: BatterySizingStatus;
  readonly view: BatterySizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (
    field: keyof BatterySizingFormDraft,
    value: string,
  ) => void;
  readonly setCellField: (field: keyof CellSpecDraft, value: string) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useBatterySizing(
  initialDraft: BatterySizingFormDraft = createEmptyDraft(),
): UseBatterySizingReturn {
  const [draft, setDraft] = useState<BatterySizingFormDraft>(initialDraft);
  const [status, setStatus] = useState<BatterySizingStatus>("idle");
  const [view, setView] = useState<BatterySizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof BatterySizingFormDraft, value: string) => {
      setDraft((d) => {
        if (field === "cell") return d;
        return { ...d, [field]: value };
      });
      setStatus("editing");
    },
    [],
  );

  const setCellField = useCallback(
    (field: keyof CellSpecDraft, value: string) => {
      setDraft((d) => ({
        ...d,
        cell: { ...d.cell, [field]: value },
      }));
      setStatus("editing");
    },
    [],
  );

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

    const result = calculateBatterySizing(draft);

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
    setField,
    setCellField,
    reset,
    loadSample,
    calculate,
  };
}
