/**
 * SolarAudit — Cable Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  CableSizingFormDraft,
  CableSizingStatus,
  CableSizingView,
  FormValidationErrors,
} from "../types";
import {
  calculateCableSizing,
  validateDraft,
} from "../services/cableSizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/cableSizingFactory";

export interface UseCableSizingReturn {
  readonly draft: CableSizingFormDraft;
  readonly status: CableSizingStatus;
  readonly view: CableSizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (
    field: keyof CableSizingFormDraft,
    value: string,
  ) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useCableSizing(
  initialDraft: CableSizingFormDraft = createEmptyDraft(),
): UseCableSizingReturn {
  const [draft, setDraft] = useState<CableSizingFormDraft>(initialDraft);
  const [status, setStatus] = useState<CableSizingStatus>("idle");
  const [view, setView] = useState<CableSizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof CableSizingFormDraft, value: string) => {
      setDraft((d) => ({ ...d, [field]: value }));
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

    const result = calculateCableSizing(draft);

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
    reset,
    loadSample,
    calculate,
  };
}
