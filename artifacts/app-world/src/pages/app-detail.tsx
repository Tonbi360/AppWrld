import { useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, ExternalLink, X, WifiOff, Bell, Download, Zap,
  AlertTriangle, ChevronLeft, BookOpen, MessageSquare, Eye
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useGetApp, useTrackAppEvent, useCreateReview,
  useListReviews, useListLogbookEntries, getListReviewsQueryKey, getGetAppQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/use-navigate";

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(score, 100) / 100 * circ;
  const color = score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold font-mono leading-none" style={{ color }}>{score > 0 ? score : "–"}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5">Score</span>
      </div>
    </div>
  );
}

function CapBadge({ active, label, icon: Icon, color }: { active: boolean; label: string; icon: React.ElementType; color: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active ? "" : "opacity-30"
      }`}
      style={active
        ? { background: color + "18", borderColor: color + "40", color }
        : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
      }
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

function ReviewCard({ review }: {
  review: {
    id: number; vote: string; comment: string; isBugReport: boolean;
    ghostName: string; developerReply?: string | null; createdAt: string;
  }
}) {
  return (
    <div className="p-4 rounded-xl border border-white/7 bg-white/[0.02]">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
            {review.ghostName[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
          {review.isBugReport && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/12 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-2.5 h-2.5" /> Bug report
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
          {review.vote === "up" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
          {review.vote === "up" ? "Recommended" : "Not for me"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      {review.developerReply && (
        <div className="mt-3 pl-3 border-l-2 border-primary/40">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-1">Developer Reply</span>
          <p className="text-xs text-muted-foreground">{review.developerReply}</p>
        </div>
      )}
    </div>
  );
}

export default function AppDetail() {
  const [, params] = useRoute("/app/:id");
  const id = Number(params?.id);
  const { goTo } = useNavigate();
  const queryClient = useQueryClient();

  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [isBugReport, setIsBugReport] = useState(false);
  const [ghostName, setGhostName] = useState(() => {
    try { return localStorage.getItem("ghostName") ?? ""; } catch { return ""; }
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "logbook">("reviews");

  const { data: app, isLoading } = useGetApp(id, {
    query: { enabled: !!id && !isNaN(id), queryKey: getGetAppQueryKey(id) },
  });
  const { data: reviews } = useListReviews(
    { appId: id },
    { query: { enabled: !!id, queryKey: getListReviewsQueryKey({ appId: id }) } }
  );
  const { data: logbook } = useListLogbookEntries(
    { appId: id },
    { query: { enabled: !!id, queryKey: ["logbook", id] } }
  );

  const trackEvent = useTrackAppEvent();
  const createReview = useCreateReview();

  const handleTryNow = () => {
    setSandboxOpen(true);
    trackEvent.mutate({ id, data: { event: "tryout" } });
  };

  const handleOpenApp = () => {
    trackEvent.mutate({ id, data: { event: "install" } });
    if (app?.url) window.open(app.url, "_blank", "noopener,noreferrer");
  };

  const handleSubmitReview = () => {
    if (!vote || !comment.trim() || !ghostName.trim()) return;
    try { localStorage.setItem("ghostName", ghostName); } catch {}
    createReview.mutate(
      { data: { appId: id, vote, comment, isBugReport, ghostName } },
      {
        onSuccess: () => {
          setReviewSubmitted(true);
          setComment("");
          setVote(null);
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ appId: id }) });
          queryClient.invalidateQueries({ queryKey: getGetAppQueryKey(id) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="skeleton h-5 w-20 rounded mb-8" />
          <div className="flex gap-6 mb-8">
            <div className="skeleton w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="skeleton h-8 w-48 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <p className="text-lg font-medium text-foreground mb-2">App not found</p>
          <p className="text-muted-foreground text-sm mb-6">This app may have been removed or the link is incorrect.</p>
          <button onClick={() => goTo("/browse")} className="text-primary text-sm hover:underline">Browse all apps</button>
        </div>
      </Layout>
    );
  }

  const accent = app.brandColor ?? "#8b5cf6";

  return (
    <Layout>
      <div className="relative">
        {/* Brand-color ambient header glow */}
        <div
          className="absolute top-0 left-0 right-0 h-72 pointer-events-none select-none"
          style={{ background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${accent}20 0%, transparent 70%)` }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back */}
          <button
            onClick={() => goTo("/browse")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4" /> Browse
          </button>

          {/* App hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row items-start gap-6 mb-8"
          >
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-2xl"
              style={{ background: accent + "25", border: `2px solid ${accent}50` }}
            >
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: accent }}>{app.name[0]}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-3xl font-bold text-white">{app.name}</h1>
                {app.isVerifiedDev && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/25">
                    Verified Dev
                  </span>
                )}
                {app.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    Featured
                  </span>
                )}
                {app.isBoosted && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    Boosted
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-3">{app.category}</p>

              {/* UVP */}
              {app.uvp && (
                <p className="text-sm text-foreground/75 italic border-l-2 pl-3 mb-4" style={{ borderColor: accent + "70" }}>
                  {app.uvp}
                </p>
              )}

              {/* Capability badges */}
              <div className="flex flex-wrap gap-2">
                <CapBadge active={app.lighthouseScore >= 85} label={`Score ${app.lighthouseScore}`} icon={Zap} color="#f59e0b" />
                <CapBadge active={app.hasOfflineSupport} label="Works Offline" icon={WifiOff} color="#22c55e" />
                <CapBadge active={app.hasPushNotifications} label="Notifications" icon={Bell} color="#3b82f6" />
                <CapBadge active={app.isInstallable} label="Installable" icon={Download} color="#8b5cf6" />
              </div>
            </div>

            {/* Score ring */}
            {app.lighthouseScore > 0 && <ScoreRing score={app.lighthouseScore} />}
          </motion.div>

          {/* Description */}
          <div className="p-5 rounded-2xl border border-white/7 bg-white/[0.02] mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Views", value: (app.views ?? 0).toLocaleString(), icon: <Eye className="w-3.5 h-3.5" /> },
              { label: "Try-outs", value: (app.tryouts ?? 0).toLocaleString(), icon: null },
              { label: "Installs", value: (app.installs ?? 0).toLocaleString(), icon: <Download className="w-3.5 h-3.5" /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border border-white/6 bg-white/[0.02]">
                <div className="text-xl font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <button
              onClick={handleTryNow}
              data-testid="button-try-now"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all text-sm"
              style={{ background: accent, boxShadow: `0 4px 24px ${accent}40` }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
            >
              Instant Test Drive
            </button>
            <button
              onClick={handleOpenApp}
              data-testid="button-install"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 bg-white/4 font-medium text-foreground hover:bg-white/7 transition-all text-sm"
            >
              <ExternalLink className="w-4 h-4" /> Open in Full Tab
            </button>
          </div>

          {/* ── Iframe Sandbox Overlay ── */}
          <AnimatePresence>
            {sandboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
              >
                <motion.div
                  initial={{ y: 80, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 80, opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", damping: 24, stiffness: 300 }}
                  className="w-full sm:w-[92vw] sm:max-w-5xl h-[90vh] sm:h-[88vh] bg-[#0e0e14] rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                  style={{ boxShadow: `0 0 0 1px ${accent}30, 0 32px 80px rgba(0,0,0,0.8)` }}
                >
                  {/* Toolbar */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                    <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6">
                      <span className="text-xs text-muted-foreground truncate">{app.url}</span>
                    </div>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setSandboxOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
                      data-testid="button-close-sandbox"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={app.url}
                      title={`${app.name} — Test Drive`}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tabs ── */}
          <div className="border-b border-white/7 mb-6">
            <div className="flex gap-5">
              {[
                { id: "reviews" as const, label: "Reviews", icon: <MessageSquare className="w-3.5 h-3.5" />, count: reviews?.length },
                { id: "logbook" as const, label: "Logbook", icon: <BookOpen className="w-3.5 h-3.5" />, count: logbook?.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                  {(tab.count ?? 0) > 0 && (
                    <span className="text-[10px] text-muted-foreground">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews tab */}
          {activeTab === "reviews" && (
            <div className="space-y-5">
              {/* Review form */}
              {!reviewSubmitted ? (
                <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02]">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Write a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Your nickname</label>
                      <input
                        value={ghostName}
                        onChange={(e) => setGhostName(e.target.value)}
                        placeholder="e.g. pixel_wolf"
                        maxLength={32}
                        data-testid="input-ghost-name"
                        className="w-full px-3 py-2.5 bg-background border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setVote("up")}
                        data-testid="button-vote-up"
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                          vote === "up"
                            ? "bg-green-500/12 border-green-500/35 text-green-400"
                            : "border-white/8 text-muted-foreground hover:border-green-500/25 hover:text-green-400"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Recommend
                      </button>
                      <button
                        onClick={() => setVote("down")}
                        data-testid="button-vote-down"
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                          vote === "down"
                            ? "bg-red-500/12 border-red-500/35 text-red-400"
                            : "border-white/8 text-muted-foreground hover:border-red-500/25 hover:text-red-400"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" /> Not for me
                      </button>
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Describe your experience — one or two sentences is perfect."
                      maxLength={280}
                      rows={2}
                      data-testid="textarea-comment"
                      className="w-full px-3 py-2.5 bg-background border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none transition-all"
                    />

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBugReport}
                          onChange={(e) => setIsBugReport(e.target.checked)}
                          data-testid="checkbox-bug-report"
                          className="rounded border-white/20 bg-background"
                        />
                        Flag as bug report
                      </label>
                      <button
                        onClick={handleSubmitReview}
                        disabled={!vote || !comment.trim() || !ghostName.trim() || createReview.isPending}
                        data-testid="button-submit-review"
                        className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                      >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-green-500/25 bg-green-500/8 text-green-400 text-sm text-center">
                  Review submitted — thank you for contributing.
                </div>
              )}

              {reviews?.length === 0 && (
                <div className="py-12 text-center text-muted-foreground border border-white/5 rounded-2xl">
                  <MessageSquare className="w-7 h-7 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-foreground/50">No reviews yet</p>
                  <p className="text-sm mt-1">Be the first to leave a review above.</p>
                </div>
              )}
              {reviews?.map((review) => <ReviewCard key={review.id} review={review} />)}
            </div>
          )}

          {/* Logbook tab */}
          {activeTab === "logbook" && (
            <div className="space-y-4">
              {logbook?.length === 0 && (
                <div className="py-12 text-center text-muted-foreground border border-white/5 rounded-2xl">
                  <BookOpen className="w-7 h-7 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-foreground/50">No logbook entries</p>
                  <p className="text-sm mt-1">The developer hasn't posted any updates yet.</p>
                </div>
              )}
              {logbook?.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl border border-white/7 bg-white/[0.02]">
                  <p className="text-sm text-foreground leading-relaxed">{entry.content}</p>
                  <p className="text-xs text-muted-foreground mt-2.5">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
