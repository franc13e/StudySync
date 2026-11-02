import { NavLink } from "react-router-dom";
import { Home, CalendarDays, Users, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/stats", label: "Stats", icon: Sparkles },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto px-5">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-canvas/90 backdrop-blur-md border-t border-border">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-espresso text-white shadow-sm"
                    : "text-chocolate"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                  {isActive && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
