import { ReactNode } from "react";
import { RouteId } from "../types";

const navItems: Array<{ id: RouteId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "status", label: "Live Status" },
  { id: "controls", label: "Controls" },
  { id: "rules", label: "Rule Editor" },
  { id: "logs", label: "Event Log" },
  { id: "configuration", label: "Configuration" },
  { id: "network", label: "Network" },
  { id: "recovery", label: "Recovery Setup" },
  { id: "ota", label: "OTA & Admin" },
  { id: "diagnostics", label: "Diagnostics" }
];

interface LayoutProps {
  route: RouteId;
  onNavigate: (route: RouteId) => void;
  children: ReactNode;
}

export function Layout({ route, onNavigate, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-kicker">Local Prototype</div>
          <h1>Greenhouse Controller</h1>
          <p>Web status, control, and recovery UI preview</p>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={item.id === route ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
