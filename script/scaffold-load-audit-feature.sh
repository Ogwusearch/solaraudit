#!/usr/bin/env bash
# scaffold-load-audit-feature.sh
# Generates the SolarAudit Load Audit frontend feature module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/features/load-audit"

mkdir -p "$ROOT/components"
mkdir -p "$ROOT/hooks"
mkdir -p "$ROOT/services"
mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Types
 *
 * Feature-local view models. These are the shapes the UI binds to.
 * They map to/from the engineering engine's types via the service layer.
 *
 * IMPORTANT: no engineering formula lives here. These are pure shapes.
 */

import type { Appliance, LoadInput, LoadResult } from "../../engineering/load";

/**
 * A single row in the load audit table, as the user edits it.
 * All fields are strings to bind naturally to form inputs; the service
 * layer parses them before calling the engine.
 */
export interface ApplianceRowDraft {
  readonly id: string;
  readonly name: string;
  readonly powerWatts: string;      // user-typed, e.g. "120"
  readonly hoursPerDay: string;     // user-typed, e.g. "5"
  readonly quantity: string;        // user-typed, e.g. "1"
  readonly essential: boolean;
}

export interface LoadAuditFormDraft {
  readonly appliances: readonly ApplianceRowDraft[];
  readonly diversityFactor: string; // user-typed, e.g. "0.8"
  readonly safetyMargin: string;    // user-typed, e.g. "0.1"
}

/**
 * Feature-level parsed input — passed to the service layer. The service
 * layer is responsible for parsing the draft into a `LoadInput`.
 */
export interface LoadAuditParsedInput {
  readonly appliances: readonly Appliance[];
  readonly diversityFactor: number;
  readonly safetyMargin: number;
}

/**
 * What the UI shows after a successful calculation. Wraps the engine
 * result with feature-level presentation metadata.
 */
export interface LoadAuditView {
  readonly result: LoadResult;
  readonly calculatedAt: string;    // ISO timestamp
}

/**
 * Form-level validation errors — field-keyed, ready for inline display.
 * Distinct from engine errors, which describe engineering problems.
 */
export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type LoadAuditStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
EOF

# ----------------------------------------------------------------------
# services/loadAuditService.ts
# ----------------------------------------------------------------------
cat > "$ROOT/services/loadAuditService.ts" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Application service
 *
 * The ONLY place in the feature that knows about the engineering engine.
 * Components and hooks call this; they never import from `engineering/`
 * directly.
 *
 * Responsibilities:
 *   - Parse the UI draft into the engine's typed input
 *   - Call the Load Engine
 *   - Return the engine result to the caller
 *
 * NOT responsible for:
 *   - Rendering
 *   - Persistence
 *   - Navigation
 *   - Engineering math (that lives in the engine)
 */

import { calculateLoad } from "../../../engineering/load";
import type {
  Appliance,
  LoadInput,
  LoadResult,
} from "../../../engineering/load";
import type {
  ApplianceRowDraft,
  LoadAuditFormDraft,
  LoadAuditParsedInput,
  FormValidationErrors,
} from "../types";

/**
 * Parse one draft row into an Appliance. Throws on invalid numeric input
 * so the caller can decide how to surface the error.
 */
function parseRow(row: ApplianceRowDraft): Appliance {
  const powerWatts = Number.parseFloat(row.powerWatts);
  const hoursPerDay = Number.parseFloat(row.hoursPerDay);
  const quantity = Number.parseInt(row.quantity, 10);

  return {
    name: row.name.trim(),
    powerWatts: Number.isFinite(powerWatts) ? powerWatts : 0,
    hoursPerDay: Number.isFinite(hoursPerDay) ? hoursPerDay : 0,
    quantity: Number.isFinite(quantity) ? quantity : 0,
  };
}

/**
 * Parse the full form draft into the engine's typed input.
 * Numeric fields that fail to parse become 0 — the engine will report
 * the resulting validation error, which is what we want surfaced.
 */
export function parseDraft(draft: LoadAuditFormDraft): LoadAuditParsedInput {
  const diversityFactor = Number.parseFloat(draft.diversityFactor);
  const safetyMargin = Number.parseFloat(draft.safetyMargin);

  return {
    appliances: draft.appliances.map(parseRow),
    diversityFactor: Number.isFinite(diversityFactor) ? diversityFactor : 1,
    safetyMargin: Number.isFinite(safetyMargin) ? safetyMargin : 0,
  };
}

/**
 * Client-side form validation. This is NOT engineering validation — the
 * engine owns that. This checks only that the form is complete enough
 * to attempt a calculation.
 */
export function validateDraft(
  draft: LoadAuditFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  if (draft.appliances.length === 0) {
    errors["appliances"] = "Add at least one appliance.";
  }

  draft.appliances.forEach((row, idx) => {
    if (row.name.trim() === "") {
      errors[`appliances.${idx}.name`] = "Name is required.";
    }
    const pw = Number.parseFloat(row.powerWatts);
    if (!Number.isFinite(pw) || pw <= 0) {
      errors[`appliances.${idx}.powerWatts`] = "Power must be > 0.";
    }
    const h = Number.parseFloat(row.hoursPerDay);
    if (!Number.isFinite(h) || h < 0 || h > 24) {
      errors[`appliances.${idx}.hoursPerDay`] =
        "Hours must be between 0 and 24.";
    }
    const q = Number.parseInt(row.quantity, 10);
    if (!Number.isFinite(q) || q < 1) {
      errors[`appliances.${idx}.quantity`] = "Quantity must be >= 1.";
    }
  });

  const df = Number.parseFloat(draft.diversityFactor);
  if (Number.isFinite(df) && (df < 0 || df > 1)) {
    errors["diversityFactor"] = "Diversity factor must be between 0 and 1.";
  }

  const sm = Number.parseFloat(draft.safetyMargin);
  if (Number.isFinite(sm) && sm < 0) {
    errors["safetyMargin"] = "Safety margin must be >= 0.";
  }

  return errors;
}

/**
 * Run the load calculation. This is the feature's public entry point to
 * the engineering engine. It parses, then delegates.
 *
 * The service does NOT catch engine errors — it returns them as part of
 * the result so the UI can render both valid numbers and errors.
 */
export function calculateLoadAudit(draft: LoadAuditFormDraft): LoadResult {
  const parsed = parseDraft(draft);

  const input: LoadInput = {
    appliances: parsed.appliances,
    diversityFactor: parsed.diversityFactor,
    safetyMargin: parsed.safetyMargin,
  };

  return calculateLoad(input);
}
EOF

# ----------------------------------------------------------------------
# services/loadAuditFactory.ts
# ----------------------------------------------------------------------
cat > "$ROOT/services/loadAuditFactory.ts" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Draft factories
 *
 * Small helpers that produce empty or sample drafts. Kept separate from
 * the calculation service so components can import them without pulling
 * in the engine.
 */

import type { ApplianceRowDraft, LoadAuditFormDraft } from "../types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

export function createEmptyRow(): ApplianceRowDraft {
  return {
    id: nextId(),
    name: "",
    powerWatts: "",
    hoursPerDay: "",
    quantity: "1",
    essential: false,
  };
}

export function createEmptyDraft(): LoadAuditFormDraft {
  return {
    appliances: [createEmptyRow()],
    diversityFactor: "0.8",
    safetyMargin: "0.1",
  };
}

export function createSampleDraft(): LoadAuditFormDraft {
  return {
    appliances: [
      { id: nextId(), name: "LED Light", powerWatts: "10", hoursPerDay: "5", quantity: "10", essential: false },
      { id: nextId(), name: "Refrigerator", powerWatts: "150", hoursPerDay: "24", quantity: "1", essential: true },
      { id: nextId(), name: "Television", powerWatts: "100", hoursPerDay: "4", quantity: "2", essential: false },
    ],
    diversityFactor: "0.8",
    safetyMargin: "0.1",
  };
}
EOF

# ----------------------------------------------------------------------
# hooks/useLoadAudit.ts
# ----------------------------------------------------------------------
cat > "$ROOT/hooks/useLoadAudit.ts" <<'EOF'
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
EOF

# ----------------------------------------------------------------------
# components/ApplianceRow.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/components/ApplianceRow.tsx" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Appliance row
 *
 * Presentational. Receives values and callbacks. No engineering logic.
 * No imports from `engineering/`.
 */

import type { ApplianceRowDraft } from "../types";

export interface ApplianceRowProps {
  readonly row: ApplianceRowDraft;
  readonly errorName?: string;
  readonly errorPower?: string;
  readonly errorHours?: string;
  readonly errorQuantity?: string;
  readonly onChangeName: (value: string) => void;
  readonly onChangePower: (value: string) => void;
  readonly onChangeHours: (value: string) => void;
  readonly onChangeQuantity: (value: string) => void;
  readonly onChangeEssential: (value: boolean) => void;
  readonly onRemove: () => void;
}

export function ApplianceRow(props: ApplianceRowProps) {
  const {
    row,
    errorName,
    errorPower,
    errorHours,
    errorQuantity,
    onChangeName,
    onChangePower,
    onChangeHours,
    onChangeQuantity,
    onChangeEssential,
    onRemove,
  } = props;

  return (
    <tr>
      <td>
        <input
          type="text"
          value={row.name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Refrigerator"
          aria-label="Appliance name"
        />
        {errorName && <span role="alert">{errorName}</span>}
      </td>
      <td>
        <input
          type="number"
          min="0"
          value={row.powerWatts}
          onChange={(e) => onChangePower(e.target.value)}
          placeholder="W"
          aria-label="Power (W)"
        />
        {errorPower && <span role="alert">{errorPower}</span>}
      </td>
      <td>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={row.hoursPerDay}
          onChange={(e) => onChangeHours(e.target.value)}
          placeholder="h"
          aria-label="Hours per day"
        />
        {errorHours && <span role="alert">{errorHours}</span>}
      </td>
      <td>
        <input
          type="number"
          min="1"
          step="1"
          value={row.quantity}
          onChange={(e) => onChangeQuantity(e.target.value)}
          placeholder="qty"
          aria-label="Quantity"
        />
        {errorQuantity && <span role="alert">{errorQuantity}</span>}
      </td>
      <td>
        <input
          type="checkbox"
          checked={row.essential}
          onChange={(e) => onChangeEssential(e.target.checked)}
          aria-label="Essential"
        />
      </td>
      <td>
        <button type="button" onClick={onRemove} aria-label="Remove row">
          ✕
        </button>
      </td>
    </tr>
  );
}
EOF

# ----------------------------------------------------------------------
# components/ApplianceTable.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/components/ApplianceTable.tsx" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Appliance table
 *
 * Presentational. Wires rows to callbacks. No engineering logic.
 */

import type { ApplianceRowDraft, FormValidationErrors } from "../types";
import { ApplianceRow } from "./ApplianceRow";

export interface ApplianceTableProps {
  readonly rows: readonly ApplianceRowDraft[];
  readonly errors: FormValidationErrors;
  readonly onAddRow: () => void;
  readonly onChangeName: (id: string, value: string) => void;
  readonly onChangePower: (id: string, value: string) => void;
  readonly onChangeHours: (id: string, value: string) => void;
  readonly onChangeQuantity: (id: string, value: string) => void;
  readonly onChangeEssential: (id: string, value: boolean) => void;
  readonly onRemoveRow: (id: string) => void;
}

export function ApplianceTable(props: ApplianceTableProps) {
  const { rows, errors, onAddRow } = props;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Power (W)</th>
            <th>Hours/day</th>
            <th>Qty</th>
            <th>Essential</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <ApplianceRow
              key={row.id}
              row={row}
              errorName={errors[`appliances.${idx}.name`]}
              errorPower={errors[`appliances.${idx}.powerWatts`]}
              errorHours={errors[`appliances.${idx}.hoursPerDay`]}
              errorQuantity={errors[`appliances.${idx}.quantity`]}
              onChangeName={(v) => props.onChangeName(row.id, v)}
              onChangePower={(v) => props.onChangePower(row.id, v)}
              onChangeHours={(v) => props.onChangeHours(row.id, v)}
              onChangeQuantity={(v) => props.onChangeQuantity(row.id, v)}
              onChangeEssential={(v) => props.onChangeEssential(row.id, v)}
              onRemove={() => props.onRemoveRow(row.id)}
            />
          ))}
        </tbody>
      </table>
      {errors["appliances"] && (
        <p role="alert">{errors["appliances"]}</p>
      )}
      <button type="button" onClick={onAddRow}>
        + Add appliance
      </button>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------
# components/LoadAuditControls.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/components/LoadAuditControls.tsx" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Controls
 *
 * Diversity factor, safety margin, and action buttons.
 * Presentational. No engineering logic.
 */

export interface LoadAuditControlsProps {
  readonly diversityFactor: string;
  readonly safetyMargin: string;
  readonly diversityError?: string;
  readonly safetyError?: string;
  readonly disabled?: boolean;
  readonly onChangeDiversityFactor: (value: string) => void;
  readonly onChangeSafetyMargin: (value: string) => void;
  readonly onCalculate: () => void;
  readonly onReset: () => void;
  readonly onLoadSample: () => void;
}

export function LoadAuditControls(props: LoadAuditControlsProps) {
  return (
    <fieldset>
      <legend>Design factors</legend>

      <label>
        Diversity factor
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.diversityFactor}
          onChange={(e) => props.onChangeDiversityFactor(e.target.value)}
          disabled={props.disabled}
        />
        {props.diversityError && (
          <span role="alert">{props.diversityError}</span>
        )}
      </label>

      <label>
        Safety margin
        <input
          type="number"
          min="0"
          step="0.05"
          value={props.safetyMargin}
          onChange={(e) => props.onChangeSafetyMargin(e.target.value)}
          disabled={props.disabled}
        />
        {props.safetyError && (
          <span role="alert">{props.safetyError}</span>
        )}
      </label>

      <div>
        <button
          type="button"
          onClick={props.onCalculate}
          disabled={props.disabled}
        >
          Calculate
        </button>
        <button type="button" onClick={props.onLoadSample}>
          Load sample
        </button>
        <button type="button" onClick={props.onReset}>
          Reset
        </button>
      </div>
    </fieldset>
  );
}
EOF

# ----------------------------------------------------------------------
# components/LoadAuditResultPanel.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/components/LoadAuditResultPanel.tsx" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Result panel
 *
 * Renders the engine result as-is. No re-computation, no formula.
 * The panel trusts the engine's numbers and surfaces its warnings and
 * errors unchanged.
 */

import type { LoadAuditView } from "../types";

export interface LoadAuditResultPanelProps {
  readonly view: LoadAuditView | null;
}

export function LoadAuditResultPanel(props: LoadAuditResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Load audit result">
      <h3>Result</h3>

      {!result.isValid && result.errors.length > 0 && (
        <div role="alert">
          <strong>Invalid input:</strong>
          <ul>
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result.isValid && (
        <dl>
          <dt>Total daily energy</dt>
          <dd>{result.totalDailyEnergyKwh} kWh</dd>

          <dt>Peak load</dt>
          <dd>{result.peakLoadKw} kW</dd>

          <dt>Load factor</dt>
          <dd>{result.loadFactor}</dd>
        </dl>
      )}

      {result.warnings.length > 0 && (
        <div>
          <strong>Warnings:</strong>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <small>Calculated at {calculatedAt}</small>
    </section>
  );
}
EOF

# ----------------------------------------------------------------------
# components/LoadAuditPage.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/components/LoadAuditPage.tsx" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 * The page has no engineering logic and no direct import from
 * `engineering/`.
 */

import { useLoadAudit } from "../hooks/useLoadAudit";
import { ApplianceTable } from "./ApplianceTable";
import { LoadAuditControls } from "./LoadAuditControls";
import { LoadAuditResultPanel } from "./LoadAuditResultPanel";

export function LoadAuditPage() {
  const audit = useLoadAudit();

  const busy = audit.status === "calculating";

  return (
    <main>
      <h1>Load Audit</h1>

      <ApplianceTable
        rows={audit.draft.appliances}
        errors={audit.formErrors}
        onAddRow={audit.addRow}
        onChangeName={audit.setName}
        onChangePower={audit.setPower}
        onChangeHours={audit.setHours}
        onChangeQuantity={audit.setQuantity}
        onChangeEssential={audit.setEssential}
        onRemoveRow={audit.removeRow}
      />

      <LoadAuditControls
        diversityFactor={audit.draft.diversityFactor}
        safetyMargin={audit.draft.safetyMargin}
        diversityError={audit.formErrors["diversityFactor"]}
        safetyError={audit.formErrors["safetyMargin"]}
        disabled={busy}
        onChangeDiversityFactor={audit.setDiversityFactor}
        onChangeSafetyMargin={audit.setSafetyMargin}
        onCalculate={audit.calculate}
        onReset={audit.reset}
        onLoadSample={audit.loadSample}
      />

      <LoadAuditResultPanel view={audit.view} />
    </main>
  );
}
EOF

# ----------------------------------------------------------------------
# index.ts
# ----------------------------------------------------------------------
cat > "$ROOT/index.ts" <<'EOF'
/**
 * SolarAudit — Load Audit feature: Public surface
 *
 * Only these exports are meant to be imported from outside the feature.
 * Everything else (individual components, hook internals) is private.
 */

export { LoadAuditPage } from "./components/LoadAuditPage";
export { useLoadAudit } from "./hooks/useLoadAudit";
export type {
  ApplianceRowDraft,
  LoadAuditFormDraft,
  LoadAuditStatus,
  LoadAuditView,
  FormValidationErrors,
} from "./types";
EOF

# ----------------------------------------------------------------------
# __tests__/loadAuditService.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/loadAuditService.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import {
  calculateLoadAudit,
  parseDraft,
  validateDraft,
} from "../services/loadAuditService";
import type { LoadAuditFormDraft } from "../types";

const baseDraft: LoadAuditFormDraft = {
  appliances: [
    { id: "a", name: "LED", powerWatts: "10", hoursPerDay: "5", quantity: "10", essential: false },
    { id: "b", name: "TV", powerWatts: "100", hoursPerDay: "4", quantity: "2", essential: false },
  ],
  diversityFactor: "0.8",
  safetyMargin: "0.1",
};

describe("parseDraft", () => {
  it("parses numeric strings into numbers", () => {
    const parsed = parseDraft(baseDraft);
    expect(parsed.appliances[0]!.powerWatts).toBe(10);
    expect(parsed.appliances[1]!.quantity).toBe(2);
    expect(parsed.diversityFactor).toBe(0.8);
    expect(parsed.safetyMargin).toBe(0.1);
  });

  it("defaults unparseable numbers to 0 or sensible values", () => {
    const bad: LoadAuditFormDraft = {
      appliances: [
        { id: "a", name: "X", powerWatts: "abc", hoursPerDay: "", quantity: "x", essential: false },
      ],
      diversityFactor: "",
      safetyMargin: "",
    };
    const parsed = parseDraft(bad);
    expect(parsed.appliances[0]!.powerWatts).toBe(0);
    expect(parsed.appliances[0]!.hoursPerDay).toBe(0);
    expect(parsed.appliances[0]!.quantity).toBe(0);
    expect(parsed.diversityFactor).toBe(1);
    expect(parsed.safetyMargin).toBe(0);
  });

  it("trims appliance names", () => {
    const draft: LoadAuditFormDraft = {
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, name: "  LED  " }],
    };
    const parsed = parseDraft(draft);
    expect(parsed.appliances[0]!.name).toBe("LED");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags empty appliance list", () => {
    const errs = validateDraft({ ...baseDraft, appliances: [] });
    expect(errs["appliances"]).toBeDefined();
  });

  it("flags missing name", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, name: "" }],
    });
    expect(errs["appliances.0.name"]).toBeDefined();
  });

  it("flags non-positive power", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, powerWatts: "0" }],
    });
    expect(errs["appliances.0.powerWatts"]).toBeDefined();
  });

  it("flags hours outside 0..24", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, hoursPerDay: "30" }],
    });
    expect(errs["appliances.0.hoursPerDay"]).toBeDefined();
  });

  it("flags quantity < 1", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, quantity: "0" }],
    });
    expect(errs["appliances.0.quantity"]).toBeDefined();
  });

  it("flags diversity factor out of range", () => {
    const errs = validateDraft({ ...baseDraft, diversityFactor: "1.5" });
    expect(errs["diversityFactor"]).toBeDefined();
  });

  it("flags negative safety margin", () => {
    const errs = validateDraft({ ...baseDraft, safetyMargin: "-0.1" });
    expect(errs["safetyMargin"]).toBeDefined();
  });
});

describe("calculateLoadAudit (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateLoadAudit(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.totalDailyEnergyKwh).toBeGreaterThan(0);
    expect(r.peakLoadKw).toBeGreaterThan(0);
  });

  it("passes engine-level errors through unchanged", () => {
    const bad: LoadAuditFormDraft = {
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, powerWatts: "0" }],
    };
    const r = calculateLoadAudit(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("surfaces engine warnings", () => {
    const draft: LoadAuditFormDraft = {
      ...baseDraft,
      diversityFactor: "0.3",
    };
    const r = calculateLoadAudit(draft);
    expect(r.warnings.some((w) => /diversity/i.test(w))).toBe(true);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/useLoadAudit.test.tsx
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/useLoadAudit.test.tsx" <<'EOF'
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLoadAudit } from "../hooks/useLoadAudit";

describe("useLoadAudit", () => {
  it("starts in idle status with an empty draft", () => {
    const { result } = renderHook(() => useLoadAudit());
    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("adds and removes rows", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.addRow());
    expect(result.current.draft.appliances.length).toBe(2);

    const id = result.current.draft.appliances[0]!.id;
    act(() => result.current.removeRow(id));
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("updates a row's fields", () => {
    const { result } = renderHook(() => useLoadAudit());
    const id = result.current.draft.appliances[0]!.id;

    act(() => {
      result.current.setName(id, "Fridge");
      result.current.setPower(id, "150");
      result.current.setHours(id, "24");
      result.current.setQuantity(id, "1");
    });

    const row = result.current.draft.appliances[0]!;
    expect(row.name).toBe("Fridge");
    expect(row.powerWatts).toBe("150");
    expect(row.hoursPerDay).toBe("24");
    expect(row.quantity).toBe("1");
  });

  it("loads a sample draft", () => {
    const { result } = renderHook(() => useLoadAudit());
    act(() => result.current.loadSample());
    expect(result.current.draft.appliances.length).toBeGreaterThan(1);
    expect(result.current.status).toBe("editing");
  });

  it("does not calculate when form is invalid", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.calculate());

    expect(result.current.status).toBe("error");
    expect(result.current.view).toBeNull();
    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it("calculates successfully on a valid draft", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.loadSample());
    act(() => result.current.calculate());

    expect(result.current.status).toBe("calculated");
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.result.isValid).toBe(true);
    expect(result.current.view!.result.totalDailyEnergyKwh).toBeGreaterThan(0);
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useLoadAudit());

    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.view).toBeNull();
    expect(result.current.draft.appliances.length).toBe(1);
  });

  it("does not implement engineering math itself", () => {
    // The hook's job is orchestration, not computation. Verify that
    // changing only a UI concern (adding a row) does not compute a
    // result — status becomes "editing", not "calculated".
    const { result } = renderHook(() => useLoadAudit());
    act(() => result.current.loadSample());
    act(() => result.current.calculate());
    expect(result.current.status).toBe("calculated");

    act(() => result.current.addRow());
    expect(result.current.status).toBe("editing");
    expect(result.current.view).not.toBeNull(); // previous result preserved
  });
});
EOF

echo "✔ Load Audit feature scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi