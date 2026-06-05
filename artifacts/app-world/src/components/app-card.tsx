import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Eye, WifiOff, Bell, Download, Zap } from "lucide-react";
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
  hasOfflineSupport?: boolean;
  hasPushNotifications?: boolean;
  isInstallable?: boolean;
  views: number;
  tryouts: number;
  installs: number;
  thumbsUp: number;
  thumbsDown: number;
  isFeatured?: boolean;
  isBoosted?: boolean;
  isVerifiedDev?: boolean;
}

interface AppCardProps {
  app: App;
  index?: number;
  hero?: boolean;
}

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(score, 100) / 100;
  const dash = filled * circ;
  const color = score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold font-mono leading-none" style={{ color }}>
        {score > 0 ? score : "–"}
      </span>
    </div>
  );
}

function CapDot({ active, color, Icon, label }: { active: boolean | undefined; color: string; Icon: React.ElementType; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
        active ? "" : "opacity-25"
      }`}
      style={active ? { backgroundColor: color + "22", color, border: `1px solid ${color}44` } : { border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}
    >
      <Icon className="w-2.5 h-2.5" />
    </span>
  );
}

export function AppCard({ app, index = 0, hero = false }: AppCardProps) {
  const { goTo } = useNavigate();
  const accent = app.brandColor ?? "#8b5cf6";

  if (hero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => goTo(`/app/${app.id}`)}
        data-testid={`card-app-${app.id}`}
        className="group relative col-span-2 rounded-2xl overflow-hidden cursor-pointer border border-white/8 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, #0d0d1100 60%)`,
          boxShadow: `0 4px 32px ${accent}18`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 48px ${accent}30`;
          (e.currentTarget as HTMLDivElement).style.borderColor = accent + "44";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px ${accent}18`;
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-xl"
            style={{ background: accent + "25", border: `1.5px solid ${accent}50` }}
          >
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: accent }}>{app.name[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-white transition-colors">{app.name}</h3>
                  {app.isVerifiedDev && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Verified</span>}
                  {app.isFeatured && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">Featured</span>}
                  {app.isBoosted && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">Boosted</span>}
                </div>
                <span className="text-xs text-muted-foreground">{app.category}</span>
              </div>
              <ScoreRing score={app.lighthouseScore} />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{app.description}</p>

            <div className="flex items-center gap-2 flex-wrap">
              <CapDot active={app.hasOfflineSupport} color="#22c55e" Icon={WifiOff} label="Offline Support" />
              <CapDot active={app.hasPushNotifications} color="#3b82f6" Icon={Bell} label="Push Notifications" />
              <CapDot active={app.isInstallable} color="#8b5cf6" Icon={Download} label="Installable" />
              <CapDot active={app.lighthouseScore >= 90} color="#f59e0b" Icon={Zap} label="High Performance" />
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.views.toLocaleString()}</span>
                <span className="flex items-center gap-1 text-green-400"><ThumbsUp className="w-3 h-3" />{app.thumbsUp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${accent}60, transparent)` }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => goTo(`/app/${app.id}`)}
      data-testid={`card-app-${app.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border border-white/7 transition-all duration-200"
      style={{
        background: "#0e0e14",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(160deg, ${accent}0f 0%, #0e0e14 50%)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 28px rgba(0,0,0,0.6), 0 0 0 1px ${accent}35`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "#0e0e14";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.5)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top color accent line */}
      <div className="h-[2px] w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-base overflow-hidden"
            style={{ background: accent + "20", border: `1px solid ${accent}35` }}
          >
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span style={{ color: accent }}>{app.name[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-sm text-foreground group-hover:text-white transition-colors truncate leading-tight">
                {app.name}
              </span>
              {app.isVerifiedDev && <span style={{ color: accent }} className="text-xs font-bold flex-shrink-0">✓</span>}
            </div>
            <span className="text-[11px] text-muted-foreground">{app.category}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1">
            {app.isBoosted && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">BOOST</span>}
            {app.isFeatured && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">TOP</span>}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {app.description}
        </p>

        {/* Capabilities + Score */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <CapDot active={app.hasOfflineSupport} color="#22c55e" Icon={WifiOff} label="Offline" />
            <CapDot active={app.hasPushNotifications} color="#3b82f6" Icon={Bell} label="Push" />
            <CapDot active={app.isInstallable} color="#8b5cf6" Icon={Download} label="Install" />
            <CapDot active={app.lighthouseScore >= 90} color="#f59e0b" Icon={Zap} label="Fast" />
          </div>
          {app.lighthouseScore > 0 && <ScoreRing score={app.lighthouseScore} />}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="w-3 h-3" />{app.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-green-400">
            <ThumbsUp className="w-3 h-3" />{app.thumbsUp}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-red-400">
            <ThumbsDown className="w-3 h-3" />{app.thumbsDown}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function AppCardSkeleton({ hero = false }: { hero?: boolean }) {
  if (hero) {
    return (
      <div className="col-span-2 rounded-2xl border border-white/6 overflow-hidden p-6 flex gap-6 bg-white/2">
        <div className="skeleton w-20 h-20 rounded-2xl flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/6 overflow-hidden bg-[#0e0e14]">
      <div className="h-[2px] w-1/2 bg-white/10" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="flex gap-1">
          {[0,1,2,3].map(i => <div key={i} className="skeleton h-5 w-8 rounded" />)}
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/5">
          <div className="skeleton h-3 w-14 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}
