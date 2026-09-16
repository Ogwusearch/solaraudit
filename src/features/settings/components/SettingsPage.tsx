/**
 * SolarAudit — Settings feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useSettings } from "../hooks/useSettings";
import { AppPreferencesForm } from "./AppPreferencesForm";
import { EngineeringDefaultsForm } from "./EngineeringDefaultsForm";

export function SettingsPage() {
  const settings = useSettings();

  if (!settings.draft || !settings.baseline) {
    return (
      <main>
        <h1>Settings</h1>
        <p>Loading…</p>
      </main>
    );
  }

  const busy = settings.status === "saving";

  return (
    <main>
      <h1>Settings</h1>

      <AppPreferencesForm
        app={settings.draft.app}
        errors={settings.formErrors}
        disabled={busy}
        onField={settings.setAppField}
      />

      <EngineeringDefaultsForm
        engineering={settings.draft.engineering}
        errors={settings.formErrors}
        disabled={busy}
        onField={settings.setEngineeringField}
      />

      <div>
        <button
          type="button"
          onClick={() => void settings.save()}
          disabled={busy || !settings.isDirty}
        >
          Save
        </button>
        <button
          type="button"
          onClick={settings.discard}
          disabled={busy || !settings.isDirty}
        >
          Discard changes
        </button>
        <button
          type="button"
          onClick={() => void settings.resetToDefaults()}
          disabled={busy}
        >
          Reset to defaults
        </button>
      </div>

      <footer>
        <small>
          {settings.isDirty
            ? "Unsaved changes."
            : `Last saved ${new Date(
                settings.baseline.updatedAt,
              ).toLocaleString()}`}
        </small>
      </footer>
    </main>
  );
}
