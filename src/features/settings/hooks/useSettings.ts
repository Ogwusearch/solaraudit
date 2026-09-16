/**
 * SolarAudit — Settings feature: Hook
 *
 * Owns the draft, the baseline (last-loaded settings), and the dirty
 * flag. Calls the service; never the repository directly.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FormValidationErrors,
  Settings,
  SettingsDraft,
  SettingsStatus,
} from "../types";
import type { SettingsService } from "../services/settingsService";
import { validateDraft } from "../services/settingsService";
import { defaultSettingsService } from "../services/defaultSettingsService";
import { toDraft } from "../services/settingsMapper";

export interface UseSettingsReturn {
  readonly draft: SettingsDraft | null;
  readonly baseline: Settings | null;
  readonly status: SettingsStatus;
  readonly isDirty: boolean;
  readonly formErrors: FormValidationErrors;

  readonly setAppField: (
    field: keyof SettingsDraft["app"],
    value: string,
  ) => void;
  readonly setEngineeringField: (
    field: keyof SettingsDraft["engineering"],
    value: string,
  ) => void;

  readonly save: () => Promise<Settings | null>;
  readonly discard: () => void;
  readonly resetToDefaults: () => Promise<Settings | null>;
}

export function useSettings(
  service: SettingsService = defaultSettingsService,
): UseSettingsReturn {
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [baseline, setBaseline] = useState<Settings | null>(null);
  const [status, setStatus] = useState<SettingsStatus>("idle");
  const [touched, setTouched] = useState(false);

  const formErrors = useMemo(
    () => (touched && draft ? validateDraft(draft) : {}),
    [draft, touched],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const settings = await service.load();
      setBaseline(settings);
      setDraft(toDraft(settings));
      setStatus("loaded");
      setTouched(false);
    } catch {
      setStatus("error");
    }
  }, [service]);

  useEffect(() => {
    void load();
  }, [load]);

  const setAppField = useCallback(
    (field: keyof SettingsDraft["app"], value: string) => {
      setDraft((d) =>
        d ? { ...d, app: { ...d.app, [field]: value } } : d,
      );
      setStatus("idle");
    },
    [],
  );

  const setEngineeringField = useCallback(
    (field: keyof SettingsDraft["engineering"], value: string) => {
      setDraft((d) =>
        d
          ? { ...d, engineering: { ...d.engineering, [field]: value } }
          : d,
      );
      setStatus("idle");
    },
    [],
  );

  const save = useCallback(async (): Promise<Settings | null> => {
    if (!draft) return null;
    setTouched(true);

    const errors = validateDraft(draft);
    if (Object.keys(errors).length > 0) {
      setStatus("error");
      return null;
    }

    setStatus("saving");
    try {
      const saved = await service.save(draft);
      setBaseline(saved);
      setDraft(toDraft(saved));
      setStatus("saved");
      return saved;
    } catch {
      setStatus("error");
      return null;
    }
  }, [draft, service]);

  const discard = useCallback(() => {
    if (baseline) {
      setDraft(toDraft(baseline));
      setTouched(false);
      setStatus("loaded");
    }
  }, [baseline]);

  const resetToDefaults = useCallback(async (): Promise<Settings | null> => {
    setStatus("saving");
    try {
      const saved = await service.resetToDefaults();
      setBaseline(saved);
      setDraft(toDraft(saved));
      setStatus("saved");
      return saved;
    } catch {
      setStatus("error");
      return null;
    }
  }, [service]);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(toDraft(baseline));
  }, [draft, baseline]);

  return {
    draft,
    baseline,
    status,
    isDirty,
    formErrors,
    setAppField,
    setEngineeringField,
    save,
    discard,
    resetToDefaults,
  };
}
