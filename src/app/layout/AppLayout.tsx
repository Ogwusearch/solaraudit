import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="app-menu-toggle"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>

        <h1 className="app-brand">SolarAudit</h1>

        <div className="app-header-spacer" />

        <UserMenu
          userName="Auditor"
          userEmail="auditor@example.com"
        />
      </header>

      <div className="app-layout">
        <Sidebar mobileOpen={mobileOpen} onNavigate={closeMobile} />

        <main className="app-content">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>

      <footer className="app-footer">
        <small>SolarAudit — engineering decision &amp; audit platform</small>
      </footer>
    </div>
  );
}