import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useCollapsibleGroups } from "./useCollapsibleGroups";

interface NavItem {
  readonly to: string;
  readonly label: string;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/projects", label: "Projects" },
    ],
  },
  {
    label: "Audit",
    items: [
      { to: "/load-audit", label: "Load Audit" },
      { to: "/energy-analysis", label: "Energy Analysis" },
    ],
  },
  {
    label: "Sizing",
    items: [
      { to: "/solar-sizing", label: "Solar Sizing" },
      { to: "/battery-sizing", label: "Battery Sizing" },
      { to: "/inverter-sizing", label: "Inverter Sizing" },
      { to: "/charge-controller-sizing", label: "Charge Controller" },
    ],
  },
  {
    label: "Wiring",
    items: [
      { to: "/cable-sizing", label: "Cable Sizing" },
      { to: "/voltage-drop", label: "Voltage Drop" },
      { to: "/protection-sizing", label: "Protection" },
    ],
  },
  {
    label: "Output",
    items: [
      { to: "/costing", label: "Costing" },
      { to: "/reports", label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings" }],
  },
];

export interface SidebarProps {
  /** Controlled from AppLayout so the header's ☰ button can open it. */
  readonly mobileOpen: boolean;
  readonly onNavigate: () => void;
}

export function Sidebar(props: SidebarProps) {
  const { mobileOpen, onNavigate } = props;
  const groups = useCollapsibleGroups();

  return (
    <>
      <aside
        id="app-sidebar"
        className={`app-sidebar${mobileOpen ? " open" : ""}`}
        aria-label="Main navigation"
      >
        <nav className="app-nav">
          {NAV_GROUPS.map((group) => {
            const collapsed = groups.isCollapsed(group.label);
            return (
              <div
                key={group.label}
                className={`app-nav-group${collapsed ? " collapsed" : ""}`}
              >
                <button
                  type="button"
                  className="app-nav-group-label"
                  aria-expanded={!collapsed}
                  onClick={() => groups.toggle(group.label)}
                >
                  <span>{group.label}</span>
                  <span className="app-nav-caret" aria-hidden="true">
                    {collapsed ? "▸" : "▾"}
                  </span>
                </button>

                {!collapsed && (
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            isActive ? "active" : undefined
                          }
                          onClick={onNavigate}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="app-scrim"
          aria-hidden="true"
          onClick={onNavigate}
        />
      )}
    </>
  );
}

/**
 * Small hook AppLayout uses to close the mobile drawer when the route
 * changes. Kept here so AppLayout does not have to import
 * useLocation directly.
 */
export function useCloseOnRouteChange(
  onRouteChange: () => void,
): void {
  // AppLayout calls this with a stable callback; re-runs on hash/path
  // changes only. Implemented via a location subscription to avoid
  // re-rendering the whole tree on every navigation.
  useEffect(() => {
    const handler = () => onRouteChange();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [onRouteChange]);
}