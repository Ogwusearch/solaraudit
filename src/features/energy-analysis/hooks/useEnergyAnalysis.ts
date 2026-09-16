/**
 * SolarAudit — Energy Analysis feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  BatteryDraft,
  EnergyAnalysisFormDraft,
  EnergyAnalysisStatus,
  EnergyAnalysisView,
  FormValidationErrors,
  PvArrayDraft,
} from "../types";
import {
  calculateEnergyAnalysis,
  validateDraft,
} from "../services/energyAnalysisService";
import {
  appendPvArray,
  createEmptyDraft,
  createEmptyPvArray,
  createSampleDraft,
} from "../services/energyAnalysisFactory";

export interface UseEnergyAnalysisReturn {
  readonly draft: EnergyAnalysisFormDraft;
  readonly status: EnergyAnalysisStatus;
  readonly view: EnergyAnalysisView | null;
  readonly formErrors: FormValidationErrors;

  readonly setTopField: (
    field: "dailyConsumptionKwh" | "days" | "includeBattery",
    value: string | boolean,
  ) => void;

  readonly setPvField: (
    idx: number,
    field: keyof PvArrayDraft,
    value: string,
  ) => void;
  readonly addPvArray: () => void;
  readonly removePvArray: (idx: number) => void;

  readonly setBatteryField: (
    field: keyof BatteryDraft,
    value: string,
  ) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useEnergyAnalysis(
  initialDraft: EnergyAnalysisFormDraft = createEmptyDraft(),
): UseEnergyAnalysisReturn {
  const [draft, setDraft] = useState<EnergyAnalysisFormDraft>(initialDraft);
  const [status, setStatus] = useState<EnergyAnalysisStatus>("idle");
  const [view, setView] = useState<EnergyAnalysisView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setTopField = useCallback(
    (
      field: "dailyConsumptionKwh" | "days" | "includeBattery",
      value: string | boolean,
    ) => {
      setDraft((d) => ({ ...d, [field]: value }));
      setStatus("editing");
    },
    [],
  );

  const setPvField = useCallback(
    (idx: number, field: keyof PvArrayDraft, value: string) => {
      setDraft((d) => {
        const pvArrays = d.pvArrays.map((pv, i) =>
          i === idx ? { ...pv, [field]: value } : pv,
        );
        return { ...d, pvArrays };
      });
      setStatus("editing");
    },
    [],
  );

  const addPvArray = useCallback(() => {
    setDraft((d) => ({ ...d, pvArrays: appendPvArray(d.pvArrays) }));
    setStatus("editing");
  }, []);

  const removePvArray = useCallback((idx: number) => {
    setDraft((d) => ({
      ...d,
      pvArrays: d.pvArrays.filter((_, i) => i !== idx),
    }));
    setStatus("editing");
  }, []);

  const setBatteryField = useCallback(
    (field: keyof BatteryDraft, value: string) => {
      setDraft((d) => ({
        ...d,
        battery: { ...d.battery, [field]: value },
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

    const result = calculateEnergyAnalysis(draft);

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
    setTopField,
    setPvField,
    addPvArray,
    removePvArray,
    setBatteryField,
    reset,
    loadSample,
    calculate,
  };
}

// Keep createEmptyPvArray referenced in this file so tree-shaking in
// production doesn't drop it when addPvArray is called before any row.
void createEmptyPvArray;
