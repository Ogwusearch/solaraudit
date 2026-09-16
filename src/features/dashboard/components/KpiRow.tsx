/**
 * SolarAudit — Dashboard feature: KPI tiles
 *
 * Presentational. Renders null as "—" rather than pretending zero.
 */

import type { DashboardKpis } from "../types";

export interface KpiRowProps {
  readonly kpis: DashboardKpis;
}

function metric(
  value: number | null,
  unit?: string,
  decimals = 2,
): string {
  if (value === null) return "—";
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function KpiRow(props: KpiRowProps) {
  const { kpis } = props;

  return (
    <div className="kpi-row">
      <div className="kpi-tile">
        <div className="kpi-label">Projects</div>
        <div className="kpi-value">{kpis.projectCount}</div>
      </div>
      <div className="kpi-tile">
        <div className="kpi-label">Daily energy</div>
        <div className="kpi-value">
          {metric(kpis.totalDailyEnergyKwh, "kWh")}
        </div>
      </div>
      <div className="kpi-tile">
        <div className="kpi-label">Installed PV</div>
        <div className="kpi-value">
          {metric(kpis.totalInstalledKwp, "kWp")}
        </div>
      </div>
      <div className="kpi-tile">
        <div className="kpi-label">Installed storage</div>
        <div className="kpi-value">
          {metric(kpis.totalInstalledKwh, "kWh")}
        </div>
      </div>
      <div className="kpi-tile">
        <div className="kpi-label">Project value</div>
        <div className="kpi-value">
          {metric(kpis.totalGrandTotal, kpis.currency ?? undefined, 2)}
        </div>
      </div>
    </div>
  );
}
