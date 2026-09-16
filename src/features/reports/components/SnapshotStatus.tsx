/**
 * SolarAudit — Reports feature: Snapshot status
 *
 * Read-only. Shows which engines have provided data. This is the
 * feature's way of telling the user "what will be in the report"
 * without them having to inspect the snapshot object.
 */

import type { ProjectSnapshot } from "../types";

export interface SnapshotStatusProps {
  readonly snapshot: ProjectSnapshot;
}

const ENGINES: ReadonlyArray<{
  key: keyof ProjectSnapshot;
  label: string;
}> = [
  { key: "load", label: "Load Audit" },
  { key: "energy", label: "Energy Analysis" },
  { key: "solar", label: "Solar Sizing" },
  { key: "battery", label: "Battery Sizing" },
  { key: "inverter", label: "Inverter Sizing" },
  { key: "chargeController", label: "Charge Controller" },
  { key: "cables", label: "Cable Sizing" },
  { key: "protections", label: "Protection Sizing" },
  { key: "bom", label: "Bill of Materials" },
  { key: "costing", label: "Costing" },
  { key: "validation", label: "Validation" },
  { key: "trace", label: "Traceability" },
];

export function SnapshotStatus(props: SnapshotStatusProps) {
  const { snapshot } = props;

  return (
    <section aria-label="Snapshot status">
      <h3>Snapshot</h3>
      <p>
        <small>
          Which engines have provided data. Absent engines become
          &ldquo;missing&rdquo; sections in the report.
        </small>
      </p>
      <ul>
        {ENGINES.map(({ key, label }) => {
          const value = snapshot[key];
          const present =
            value !== undefined &&
            !(Array.isArray(value) && value.length === 0);
          return (
            <li key={String(key)}>
              {label}:{" "}
              {present ? (
                <span aria-label="provided">provided</span>
              ) : (
                <span aria-label="missing">missing</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
