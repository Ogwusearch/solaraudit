/**
 * SolarAudit — Inverter Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  FormValidationErrors,
  InverterSizingFormDraft,
  InverterSizingStatus,
  InverterSizingView,
} from "../types";
import {
  calculateInverterSizing,
  validateDraft,
} from "../services/inverterSizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/inverterSizingFactory";

export interface UseInverterSizingReturn {
  readonly draft: InverterSizingFormDraft;
  readonly status: InverterSizingStatus;
  readonly view: InverterSizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (
    field: keyof InverterSizingFormDraft,
    value: string,
  ) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useInverterSizing(
  initialDraft: InverterSizingFormDraft = createEmptyDraft(),
): UseInverterSizingReturn {
  const [draft, setDraft] = useState<InverterSizingFormDraft>(initialDraft);
  const [status, setStatus] = useState<InverterSizingStatus>("idle");
  const [view, setView] = useState<InverterSizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof InverterSizingFormDraft, value: string) => {
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

    const result = calculateInverterSizing(draft);

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
