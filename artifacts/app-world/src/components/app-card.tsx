import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Eye, Zap, WifiOff, Bell, Download } from "lucide-react";
import { useNavigate } from "@/lib/use-navigate";

interface App {
  id: number;
  name: string;
  description: string;
  url: string;
  iconUrl?: string | null;
  brandColor?: string | null;
  category: string;
  lighthouseScore: number;
  hasOfflineSupport: boolean;
  hasPushNotifications: boolean;
  isInstallable: boolean;
  views: number;
  tryouts: number;
  installs: number;
  thumbsUp: number;
  thumbsDown: number;
  isFeatured: boolean;
  isBoosted: boolean;
  isVerifiedDev: boolean;
}

interface AppCardProps {
  app: App;
  index?: number;
}

function CapabilityBadge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-muted-foreground border border-white/5"
      title={label}
    >
      {icon}
    </span>
  );
}

export function AppCard({ app, index = 0 }: AppCardProps) {
  const { goTo } = useNavigate();
  const accentColor = app.brandColor ?? "#8b5cf6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => goTo(`/app/${app.id}`)}
      data-testid={`card-app-${app.id}`}
      className="group relative flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-card cursor-pointer transition-all duration-200 hover:border-border hover:-translate-y-0.5"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${accentColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
      }}
    >
      {/* Boosted / Featured badge */}
      {(app.isBoosted || app.isFeatured) && (
        <div className="absolute top-3 right-3 flex gap-1">
          {app.isBoosted && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/20">
              Boosted
            </span>
          )}
          {app.isFeatured && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/20">
              Featured
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg overflow-hidden"
          style={{ backgroundColor: accentColor + "33", border: `1px solid ${accentColor}44` }}
        >
          {app.iconUrl ? (
            <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span style={{ color: accentColor }}>{app.name[0]}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {app.name}
            </h3>
            {app.isVerifiedDev && (
              <span className="text-primary text-xs" title="Verified Developer">✓</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{app.category}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {app.description}
      </p>

      {/* Capability badges */}
      <div className="flex items-center gap-1.5">
        <CapabilityBadge icon={<Zap className="w-2.5 h-2.5" />} label={`Lighthouse: ${app.lighthouseScore}`} active={app.lighthouseScore >= 90} />
        <CapabilityBadge icon={<WifiOff className="w-2.5 h-2.5" />} label="Offline Support" active={app.hasOfflineSupport} />
        <CapabilityBadge icon={<Bell className="w-2.5 h-2.5" />} label="Push Notifications" active={app.hasPushNotifications} />
        <CapabilityBadge icon={<Download className="w-2.5 h-2.5" />} label="Installable" active={app.isInstallable} />
        {app.lighthouseScore > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">{app.lighthouseScore}</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 pt-1 border-t border-border/40">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground" data-testid={`text-views-${app.id}`}>
          <Eye className="w-3 h-3" />
          {app.views.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-green-400" data-testid={`text-thumbsup-${app.id}`}>
          <ThumbsUp className="w-3 h-3" />
          {app.thumbsUp}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-red-400" data-testid={`text-thumbsdown-${app.id}`}>
          <ThumbsDown className="w-3 h-3" />
          {app.thumbsDown}
        </span>
      </div>
    </motion.div>
  );
}

export function AppCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-card">
      <div className="flex items-start gap-3">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="flex gap-1">
        <div className="skeleton h-4 w-12 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
      </div>
      <div className="flex gap-3 pt-1 border-t border-border/40">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-10 rounded" />
      </div>
    </div>
  );
}
