import { Navigate, type RouteObject } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { NotFoundPage } from "./layout/NotFoundPage";

import { DashboardPage } from "../features/dashboard";
import { ProjectsPage, ProjectDetailPage } from "../features/projects";
import { LoadAuditPage } from "../features/load-audit";
import { EnergyAnalysisPage } from "../features/energy-analysis";
import { SolarSizingPage } from "../features/solar-sizing";
import { BatterySizingPage } from "../features/battery-sizing";
import { InverterSizingPage } from "../features/inverter-sizing";
import { ChargeControllerSizingPage } from "../features/charge-controller-sizing";
import { CableSizingPage } from "../features/cable-sizing";
import { VoltageDropPage } from "../features/voltage-drop";
import { ProtectionSizingPage } from "../features/protection-sizing";
import { CostingPage } from "../features/costing";
import { ReportsPage } from "../features/reports";
import { SettingsPage } from "../features/settings";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:projectId", element: <ProjectDetailPage /> },
      { path: "load-audit", element: <LoadAuditPage /> },
      { path: "energy-analysis", element: <EnergyAnalysisPage /> },
      { path: "solar-sizing", element: <SolarSizingPage /> },
      { path: "battery-sizing", element: <BatterySizingPage /> },
      { path: "inverter-sizing", element: <InverterSizingPage /> },
      { path: "charge-controller-sizing", element: <ChargeControllerSizingPage /> },
      { path: "cable-sizing", element: <CableSizingPage /> },
      { path: "voltage-drop", element: <VoltageDropPage /> },
      { path: "protection-sizing", element: <ProtectionSizingPage /> },
      { path: "costing", element: <CostingPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];