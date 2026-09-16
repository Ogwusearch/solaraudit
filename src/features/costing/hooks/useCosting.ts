/**
 * SolarAudit — Costing feature: Hook
 *
 * Owns editing state and exposes actions. Calls the service, never the
 * engineering engine directly.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  CostLineItemDraft,
  CostingFormDraft,
  CostingStatus,
  CostingView,
  FormValidationErrors,
  OverheadsDraft,
} from "../types";
import {
  calculateCostingFromDraft,
  validateDraft,
} from "../services/costingService";
import {
  appendLineItem,
  createEmptyDraft,
  createSampleDraft,
} from "../services/costingFactory";

type TopField =
  | "currency"
  | "wasteFactor"
  | "discountPercent"
  | "taxPercent";

export interface UseCostingReturn {
  readonly draft: CostingFormDraft;
  readonly status: CostingStatus;
  readonly view: CostingView | null;
  readonly formErrors: FormValidationErrors;

  readonly setTopField: (field: TopField, value: string) => void;
  readonly setItemField: (
    id: string,
    field: keyof Omit<CostLineItemDraft, "id">,
    value: string,
  ) => void;
  readonly setOverheadField: (
    field: keyof OverheadsDraft,
    value: string,
  ) => void;

  readonly addItem: () => void;
  readonly removeItem: (id: string) => void;

  readonly reset: () => void;
  readonly loadSample: () => void;
  readonly calculate: () => void;
}

export function useCosting(
  initialDraft: CostingFormDraft = createEmptyDraft(),
): UseCostingReturn {
  const [draft, setDraft] = useState<CostingFormDraft>(initialDraft);
  const [status, setStatus] = useState<CostingStatus>("idle");
  const [view, setView] = useState<CostingView | null>(null);
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const setTopField = useCallback((field: TopField, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setStatus("editing");
  }, []);

  const setItemField = useCallback(
    (
      id: string,
      field: keyof Omit<CostLineItemDraft, "id">,
      value: string,
    ) => {
      setDraft((d) => ({
        ...d,
        items: d.items.map((it) =>
          it.id === id ? { ...it, [field]: value } : it,
        ),
      }));
      setStatus("editing");
    },
    [],
  );

  const setOverheadField = useCallback(
    (field: keyof OverheadsDraft, value: string) => {
      setDraft((d) => ({
        ...d,
        overheads: { ...d.overheads, [field]: value },
      }));
      setStatus("editing");
    },
    [],
  );

  const addItem = useCallback(() => {
    setDraft((d) => ({ ...d, items: appendLineItem(d.items) }));
    setStatus("editing");
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraft((d) => ({
      ...d,
      items: d.items.filter((it) => it.id !== id),
    }));
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

    const result = calculateCostingFromDraft(draft);

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
    setItemField,
    setOverheadField,
    addItem,
    removeItem,
    reset,
    loadSample,
    calculate,
  };
}
