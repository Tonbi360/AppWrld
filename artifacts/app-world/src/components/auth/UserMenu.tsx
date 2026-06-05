import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Shield, BookOpen, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";

export function UserMenu() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-white/6 animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={login}
        className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
      >
        Log in
      </button>
    );
  }

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("") || user.email?.[0]?.toUpperCase() || "?";

  const roleBadge =
    user.role === "admin"
      ? { label: "Admin", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" }
      : user.role === "developer"
      ? { label: "Dev", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
      : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={initials}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-semibold text-primary">
            {initials}
          </div>
        )}
        {roleBadge && (
          <span className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#141418] shadow-xl shadow-black/40 py-1.5 z-50">
          <div className="px-3.5 py-2.5 border-b border-white/6 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email ?? "User"}
            </p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
            <span className={`mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
              user.role === "admin"
                ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                : user.role === "developer"
                ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                : "text-muted-foreground bg-white/5 border-white/10"
            }`}>
              {user.role}
            </span>
          </div>

          {user.role === "developer" && (
            <Link
              href="/dev"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Developer Portal
            </Link>
          )}

          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}

          <div className="border-t border-white/6 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
