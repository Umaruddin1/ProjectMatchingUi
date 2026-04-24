import { NavLink } from "react-router";
import {
  Upload,
  Table2,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  History,
  Database,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";

const navItems = [
  { path: "/", label: "Upload File", icon: Upload },
  { path: "/preview", label: "Data Preview", icon: Table2 },
  { path: "/errors", label: "Error Detection", icon: AlertTriangle },
  { path: "/corrections", label: "Corrections", icon: Wrench },
  { path: "/results", label: "Results", icon: CheckCircle2 },
  { path: "/history", label: "Processing History", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm tracking-tight">
              DataBridge
            </span>
            <span className="block text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">
              Correction Tool
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground/80">
            Processing large Excel files with 1500+ project records
          </p>
        </div>
      </div>
    </aside>
  );
}
