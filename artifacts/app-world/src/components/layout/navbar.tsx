import { Link, useLocation } from "wouter";
import { Search, Globe, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/use-navigate";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Navbar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { goTo } = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const coreLinks = [
    { href: "/", label: "Discover" },
    { href: "/browse", label: "Browse" },
  ];

  const userLinks = isAuthenticated
    ? [{ href: "/dashboard", label: "My Activity" }]
    : [{ href: "/submit", label: "Submit" }];

  const devLinks =
    isAuthenticated && (user?.role === "developer" || user?.role === "admin")
      ? [{ href: "/dev", label: "Dev Portal" }]
      : [];

  const adminLinks =
    isAuthenticated && user?.role === "admin"
      ? [{ href: "/admin", label: "Admin" }]
      : [];

  const allLinks = [...coreLinks, ...userLinks, ...devLinks, ...adminLinks];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-primary/35 transition-shadow">
              <Globe className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-serif text-[15px] font-semibold tracking-tight text-foreground">
              App<span className="text-primary">World</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive(link.href)
                    ? "text-foreground bg-foreground/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goTo("/browse")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated && <NotificationBell />}
            <UserMenu />
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-border/30 pt-2 space-y-0.5">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "bg-foreground/8 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
