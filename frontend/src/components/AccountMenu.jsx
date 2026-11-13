import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/** Round avatar button with the user's initial; opens a small menu with who's signed in and "Log out". */
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const signOut = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative shrink-0" ref={box}>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}
        aria-label="Account" title={user.username}
        className="w-10 h-10 rounded-full bg-lavender text-espresso font-display font-extrabold text-lg flex items-center justify-center border border-border hover:opacity-90 transition">
        {user.username.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 bg-butter border border-border rounded-2xl shadow-lg p-2 z-40">
          <div className="px-3 py-2">
            <p className="text-xs text-chocolate">Signed in as</p>
            <p className="font-bold truncate">{user.username}</p>
            {user.email && <p className="text-xs text-chocolate truncate">{user.email}</p>}
          </div>
          <div className="h-px bg-border my-1" />
          <button type="button" role="menuitem" onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-petal/30 transition">
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
