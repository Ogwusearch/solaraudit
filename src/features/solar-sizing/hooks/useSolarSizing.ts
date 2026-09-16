/**
 * SolarAudit — Solar Sizing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service; never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  PanelSpecDraft,
  FormValidationErrors,
  SolarSizingFormDraft,
  SolarSizingStatus,
  SolarSizingView,
} from "../types";
import {
  calculateSolarSizing,
  validateDraft,
} from "../services/solarSizingService";
import {
  createEmptyDraft,
  createSampleDraft,
} from "../services/solarSizingFactory";

export interface UseSolarSizingReturn {
  readonly draft: SolarSizingFormDraft;
  readonly status: SolarSizingStatus;
  readonly view: SolarSizingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setField: (field: keyof SolarSizingFormDraft, value: string) => void;
  readonly setPanelField: (field: keyof PanelSpecDraft, value: string) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useSolarSizing(
  initialDraft: SolarSizingFormDraft = createEmptyDraft(),
): UseSolarSizingReturn {
  const [draft, setDraft] = useState<SolarSizingFormDraft>(initialDraft);
  const [status, setStatus] = useState<SolarSizingStatus>("idle");
  const [view, setView] = useState<SolarSizingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setField = useCallback(
    (field: keyof SolarSizingFormDraft, value: string) => {
      setDraft((d) => {
        if (field === "panel") return d;
        return { ...d, [field]: value };
      });
      setStatus("editing");
    },
    [],
  );

  const setPanelField = useCallback(
    (field: keyof PanelSpecDraft, value: string) => {
      setDraft((d) => ({
        ...d,
        panel: { ...d.panel, [field]: value },
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

    const result = calculateSolarSizing(draft);

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
    setPanelField,
    reset,
    loadSample,
    calculate,
  };
}
