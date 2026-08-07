import { NavLink } from "react-router-dom";
import { Home, CalendarDays, Flame, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/schedule", icon: CalendarDays, label: "Schedule" },
  { to: "/streaks", icon: Flame, label: "Streaks" },
];

export default function Layout({ children }) {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-md px-5 py-4 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">
          🍵 StudySync
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-chocolate font-medium">
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-inactive transition-colors"
            title="Log out"
          >
            <LogOut size={18} className="text-chocolate" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-4">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-butter/90 backdrop-blur-md border-t border-border">
        <div className="max-w-2xl mx-auto flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-full transition-all ${
                  isActive
                    ? "bg-espresso text-white"
                    : "text-chocolate hover:bg-inactive"
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[11px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
