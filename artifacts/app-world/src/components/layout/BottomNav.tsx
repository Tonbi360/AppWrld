import { Link, useLocation } from "wouter";
import { Home, Compass, Plus, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const items = isAuthenticated
    ? [
        { href: "/", icon: Home, label: "Home" },
        { href: "/browse", icon: Compass, label: "Browse" },
        { href: "/submit", icon: Plus, label: "Submit", primary: true },
        { href: "/dashboard", icon: LayoutDashboard, label: "Activity" },
        { href: "/profile", icon: User, label: "Profile" },
      ]
    : [
        { href: "/", icon: Home, label: "Home" },
        { href: "/browse", icon: Compass, label: "Browse" },
        { href: "/submit", icon: Plus, label: "Submit", primary: true },
        { href: "/profile", icon: User, label: "Profile" },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/40 bottom-nav-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[52px] py-1"
            >
              <div className={`relative flex items-center justify-center ${
                item.primary
                  ? "w-10 h-10 rounded-xl bg-primary shadow-md shadow-primary/30"
                  : "w-8 h-8 rounded-lg"
              } ${active && !item.primary ? "bg-primary/12" : ""}`}>
                <item.icon
                  className={`${item.primary ? "w-5 h-5 text-white" : "w-4 h-4"} ${
                    active && !item.primary ? "text-primary" : !item.primary ? "text-muted-foreground" : ""
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${
                active ? "text-primary" : "text-muted-foreground"
              } ${item.primary ? "hidden" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
