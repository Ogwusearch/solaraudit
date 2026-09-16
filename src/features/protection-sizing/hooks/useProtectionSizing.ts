/**
 * SolarAudit — Protection Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  FormValidationErrors,
  ProtectionSizingFormDraft,
  ProtectionSizingStatus,
  ProtectionSizingView,
} from "../types";
import {
  calculateProtectionSizing,
  validateDraft,
} from "../services/protectionSizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/protectionSizingFactory";

export interface UseProtectionSizingReturn {
  readonly draft: ProtectionSizingFormDraft;
  readonly status: ProtectionSizingStatus;
  readonly view: ProtectionSizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (
    field: keyof ProtectionSizingFormDraft,
    value: string,
  ) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useProtectionSizing(
  initialDraft: ProtectionSizingFormDraft = createEmptyDraft(),
): UseProtectionSizingReturn {
  const [draft, setDraft] =
    useState<ProtectionSizingFormDraft>(initialDraft);
  const [status, setStatus] = useState<ProtectionSizingStatus>("idle");
  const [view, setView] = useState<ProtectionSizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof ProtectionSizingFormDraft, value: string) => {
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

    const result = calculateProtectionSizing(draft);

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
