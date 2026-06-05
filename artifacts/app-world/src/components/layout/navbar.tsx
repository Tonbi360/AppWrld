import { Link, useLocation } from "wouter";
import { Search, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/use-navigate";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/auth/UserMenu";

export function Navbar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { goTo } = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const coreLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/submit", label: "Submit" },
    { href: "/feedback", label: "Feedback" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const mobileLinks = [...coreLinks];
  if (isAuthenticated && user?.role === "developer") {
    mobileLinks.push({ href: "/dev", label: "Dev Portal" });
  }
  if (isAuthenticated && user?.role === "admin") {
    mobileLinks.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#0d0d11]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[17px] font-bold tracking-tight text-white">
              App<span className="text-primary">World</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {coreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-foreground bg-white/7"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === "developer" && (
              <Link
                href="/dev"
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive("/dev")
                    ? "text-foreground bg-white/7"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                Dev Portal
              </Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                href="/admin"
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive("/admin")
                    ? "text-foreground bg-white/7"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo("/browse")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <UserMenu />
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-white/6 space-y-0.5">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "bg-white/7 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/4"
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
