import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ExternalLink, ChevronRight, Bell, Package, Clock } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { getStatusMeta } from "@/lib/status";

interface Submission {
  id: number;
  name: string;
  url: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    fetch("/api/submissions/mine", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setSubmissions(d); setLoadingSubs(false); })
      .catch(() => setLoadingSubs(false));

    fetch("/api/notifications", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setNotifications(d); setLoadingNotifs(false); })
      .catch(() => setLoadingNotifs(false));
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;
  const displayName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10 page-enter">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Hey, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your submissions and stay up to date.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/submit"
            className="flex items-center gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/16 hover:bg-primary/12 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submit PWA</p>
              <p className="text-xs text-muted-foreground">List your app</p>
            </div>
          </Link>

          <Link
            href="/browse"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-border transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Browse</p>
              <p className="text-xs text-muted-foreground">Discover PWAs</p>
            </div>
          </Link>
        </div>

        {/* Submissions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">My Submissions</h2>
            <Link href="/submit" className="text-xs text-primary hover:underline">+ New</Link>
          </div>

          {loadingSubs ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl skeleton" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card p-6 text-center">
              <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
              <Link href="/submit" className="text-xs text-primary hover:underline mt-1 inline-block">
                Submit your first PWA
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub, i) => {
                const meta = getStatusMeta(sub.status);
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/status/${sub.id}`}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40 hover:border-border/70 transition-all group"
                    >
                      <div className={`${meta.cssClass} shrink-0`}>
                        <div className={`status-dot ${meta.isActive ? "is-active" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sub.name}</p>
                        <div className={`${meta.cssClass} mt-1`}>
                          <span className="status-pill">{meta.label}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Notifications
              {unread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-white">
                  {unread}
                </span>
              )}
            </h2>
          </div>

          {loadingNotifs ? (
            <div className="h-24 rounded-2xl skeleton" />
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card p-6 text-center">
              <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                    n.isRead ? "bg-card border-border/40" : "bg-primary/4 border-primary/15"
                  }`}
                >
                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                  <div className={n.isRead ? "" : ""}>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
