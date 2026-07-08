import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function clearAll() {
    await fetch("/api/notifications/clear", { method: "DELETE", credentials: "include" });
    setNotifications([]);
    setOpen(false);
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/60 bg-popover shadow-xl shadow-black/30 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nothing yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/20 last:border-0 hover:bg-foreground/4 transition-colors ${
                    !n.isRead ? "bg-primary/4" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className={!n.isRead ? "" : "pl-4"}>
                      <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
