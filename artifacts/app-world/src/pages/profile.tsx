import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Shield, Code2, LayoutDashboard, ChevronRight, Globe } from "lucide-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";

const ROLE_META = {
  user: {
    label: "User",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border/50",
    description: "Browse apps, leave reviews, and submit PWAs for listing.",
  },
  developer: {
    label: "Developer",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    description: "Everything a user can do, plus access to the Dev Portal — post logbook updates and reply to reviews on your listed apps.",
  },
  admin: {
    label: "Admin",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    description: "Full control — approve/reject submissions, manage feedback, reply to reviews, and post logbook entries across all apps.",
  },
};

export default function Profile() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="h-24 rounded-2xl skeleton mb-4" />
          <div className="h-32 rounded-2xl skeleton" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-20 text-center page-enter">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Sign in to AppWorld</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Track submissions, get notified on updates, and manage your apps.
          </p>
          <button
            onClick={login}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign in
          </button>
        </div>
      </Layout>
    );
  }

  const role = (user.role ?? "user") as keyof typeof ROLE_META;
  const meta = ROLE_META[role] ?? ROLE_META.user;

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("") || user.email?.[0]?.toUpperCase() || "U";

  async function handleUpgradeToDeveloper() {
    setUpgrading(true);
    setUpgradeError("");
    try {
      const res = await fetch("/api/users/me/become-developer", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setUpgraded(true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const d = await res.json() as { error?: string };
        setUpgradeError(d.error ?? "Something went wrong");
      }
    } catch {
      setUpgradeError("Network error — try again");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-10 page-enter">

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-8"
        >
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={initials}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/30 mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-2xl font-bold text-primary mb-4">
              {initials}
            </div>
          )}
          <h1 className="text-xl font-semibold text-foreground">
            {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Account"}
          </h1>
          {user.email && (
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          )}
          <span className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}>
            {role === "admin" && <Shield className="w-3 h-3" />}
            {role === "developer" && <Code2 className="w-3 h-3" />}
            {meta.label}
          </span>
        </motion.div>

        {/* Role description */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border/40 p-4 mb-4"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>

          {role === "user" && !upgraded && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs font-medium text-foreground mb-1">Want more?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Become a Developer to post logbook updates and respond to reviews on your submitted apps.
              </p>
              {upgradeError && <p className="text-xs text-destructive mb-2">{upgradeError}</p>}
              <button
                onClick={handleUpgradeToDeveloper}
                disabled={upgrading}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {upgrading ? "Upgrading..." : "Become a Developer"}
              </button>
            </div>
          )}

          {upgraded && (
            <p className="mt-3 text-xs text-green-400 font-medium">
              Developer access granted — reloading...
            </p>
          )}
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border/40 overflow-hidden mb-4"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/4 transition-colors border-b border-border/30"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">My Activity</p>
              <p className="text-xs text-muted-foreground">Submissions and notifications</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {(role === "developer" || role === "admin") && (
            <Link
              href="/dev"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/4 transition-colors border-b border-border/30"
            >
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Dev Portal</p>
                <p className="text-xs text-muted-foreground">Logbook and review replies</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/4 transition-colors border-b border-border/30"
            >
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Admin Panel</p>
                <p className="text-xs text-muted-foreground">Review submissions and manage platform</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>

      </div>
    </Layout>
  );
}
