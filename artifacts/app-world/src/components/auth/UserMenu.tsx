import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Shield, Code2, LayoutDashboard, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";

export function UserMenu() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={login}
        className="px-3.5 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        Log in
      </button>
    );
  }

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("") || user.email?.[0]?.toUpperCase() || "U";

  const roleBadge =
    user.role === "admin"
      ? { label: "Admin", style: "text-amber-400 bg-amber-400/10 border-amber-400/20" }
      : user.role === "developer"
      ? { label: "Dev", style: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
      : { label: "User", style: "text-muted-foreground bg-muted border-border/50" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-foreground/5 transition-colors"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={initials}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-border/40"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[11px] font-semibold text-primary">
            {initials}
          </div>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/60 bg-popover shadow-xl shadow-black/25 py-1.5 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email ?? "User"}
            </p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
            )}
            <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.style}`}>
              {roleBadge.label}
            </span>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/4 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            My Activity
          </Link>

          {(user.role === "developer" || user.role === "admin") && (
            <Link
              href="/dev"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/4 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              Dev Portal
            </Link>
          )}

          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/4 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          <div className="border-t border-border/30 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/4 transition-colors"
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
