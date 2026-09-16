/**
 * SolarAudit — Voltage Drop feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  FormValidationErrors,
  VoltageDropFormDraft,
  VoltageDropStatus,
  VoltageDropView,
} from "../types";
import {
  calculateVoltageDropFromDraft,
  validateDraft,
} from "../services/voltageDropService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/voltageDropFactory";

export interface UseVoltageDropReturn {
  readonly draft: VoltageDropFormDraft;
  readonly status: VoltageDropStatus;
  readonly view: VoltageDropView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (field: keyof VoltageDropFormDraft, value: string) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useVoltageDrop(
  initialDraft: VoltageDropFormDraft = createEmptyDraft(),
): UseVoltageDropReturn {
  const [draft, setDraft] = useState<VoltageDropFormDraft>(initialDraft);
  const [status, setStatus] = useState<VoltageDropStatus>("idle");
  const [view, setView] = useState<VoltageDropView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof VoltageDropFormDraft, value: string) => {
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

    const result = calculateVoltageDropFromDraft(draft);

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
