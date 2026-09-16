/**
 * SolarAudit — Charge Controller Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  ChargeControllerSizingFormDraft,
  ChargeControllerSizingStatus,
  ChargeControllerSizingView,
  FormValidationErrors,
} from "../types";
import {
  calculateChargeControllerSizing,
  validateDraft,
} from "../services/chargeControllerSizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/chargeControllerSizingFactory";

export interface UseChargeControllerSizingReturn {
  readonly draft: ChargeControllerSizingFormDraft;
  readonly status: ChargeControllerSizingStatus;
  readonly view: ChargeControllerSizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (
    field: keyof ChargeControllerSizingFormDraft,
    value: string,
  ) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useChargeControllerSizing(
  initialDraft: ChargeControllerSizingFormDraft = createEmptyDraft(),
): UseChargeControllerSizingReturn {
  const [draft, setDraft] =
    useState<ChargeControllerSizingFormDraft>(initialDraft);
  const [status, setStatus] =
    useState<ChargeControllerSizingStatus>("idle");
  const [view, setView] = useState<ChargeControllerSizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof ChargeControllerSizingFormDraft, value: string) => {
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

    const result = calculateChargeControllerSizing(draft);

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
