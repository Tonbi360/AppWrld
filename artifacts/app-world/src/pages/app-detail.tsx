import { useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, ExternalLink, X, Zap, WifiOff, Bell, Download,
  AlertTriangle, ChevronLeft, BookOpen, MessageSquare
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useGetApp, useCheckIframeSupport, useTrackAppEvent, useCreateReview,
  useListReviews, useListLogbookEntries, getListReviewsQueryKey, getGetAppQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/use-navigate";

function Badge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
      active
        ? "bg-primary/10 border-primary/30 text-primary"
        : "bg-white/3 border-border/40 text-muted-foreground/40"
    }`}>
      {icon} {label}
    </span>
  );
}

function ReviewCard({ review }: { review: { id: number; vote: string; comment: string; isBugReport: boolean; ghostName: string; developerReply?: string | null; createdAt: string } }) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card/50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-foreground">
            {review.ghostName[0]?.toUpperCase()}
          </span>
          <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
          {review.isBugReport && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-2.5 h-2.5" /> Bug
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
          {review.vote === "up" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{review.comment}</p>
      {review.developerReply && (
        <div className="mt-3 pl-3 border-l-2 border-primary/50">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Developer Reply</span>
          </div>
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
  const [ghostName, setGhostName] = useState(() => localStorage.getItem("ghostName") ?? "");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "logbook">("reviews");

  const { data: app, isLoading } = useGetApp(id, { query: { enabled: !!id, queryKey: getGetAppQueryKey(id) } });
  const { data: iframeCheck } = useCheckIframeSupport(id, { query: { enabled: sandboxOpen || false, queryKey: ["checkIframe", id] } });
  const { data: reviews } = useListReviews({ appId: id }, { query: { enabled: !!id, queryKey: getListReviewsQueryKey({ appId: id }) } });
  const { data: logbook } = useListLogbookEntries({ appId: id }, { query: { enabled: !!id, queryKey: ["logbook", id] } });

  const trackEvent = useTrackAppEvent();
  const createReview = useCreateReview();

  const handleTryNow = () => {
    setSandboxOpen(true);
    trackEvent.mutate({ id, data: { event: "tryout" } });
  };

  const handleInstall = () => {
    trackEvent.mutate({ id, data: { event: "install" } });
    window.open(app?.url, "_blank");
  };

  const handleSubmitReview = async () => {
    if (!vote || !comment.trim() || !ghostName.trim()) return;
    localStorage.setItem("ghostName", ghostName);
    createReview.mutate(
      { data: { appId: id, vote, comment, isBugReport, ghostName } },
      {
        onSuccess: () => {
          setReviewSubmitted(true);
          setComment("");
          setVote(null);
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ appId: id }) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="skeleton h-8 w-48 rounded mb-6" />
          <div className="skeleton h-64 w-full rounded-2xl mb-4" />
        </div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted-foreground">
          <p className="text-lg">App not found</p>
          <button onClick={() => goTo("/browse")} className="mt-4 text-primary text-sm">Browse all apps</button>
        </div>
      </Layout>
    );
  }

  const accentColor = app.brandColor ?? "#8b5cf6";

  return (
    <Layout>
      {/* Dynamic background glow */}
      <div className="relative">
        <div
          className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 70%)` }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back */}
          <button
            onClick={() => goTo("/browse")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4" /> Browse
          </button>

          {/* App header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start gap-6 mb-8"
          >
            <div
              className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-3xl overflow-hidden"
              style={{ backgroundColor: accentColor + "33", border: `2px solid ${accentColor}44` }}
            >
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: accentColor }}>{app.name[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-serif text-3xl font-bold text-foreground">{app.name}</h1>
                {app.isVerifiedDev && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/25">
                    Verified Dev
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2">{app.category}</p>
              {app.uvp && (
                <p className="text-sm text-foreground/80 italic border-l-2 border-primary/40 pl-3 mb-3">{app.uvp}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge icon={<Zap className="w-3 h-3" />} label={`Score: ${app.lighthouseScore}`} active={app.lighthouseScore >= 85} />
                <Badge icon={<WifiOff className="w-3 h-3" />} label="Offline" active={app.hasOfflineSupport} />
                <Badge icon={<Bell className="w-3 h-3" />} label="Notifications" active={app.hasPushNotifications} />
                <Badge icon={<Download className="w-3 h-3" />} label="Installable" active={app.isInstallable} />
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <div className="mb-6 p-5 rounded-xl bg-card/50 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Views", value: app.views?.toLocaleString() },
              { label: "Try-outs", value: app.tryouts?.toLocaleString() },
              { label: "Installs", value: app.installs?.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-xl font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <button
              onClick={handleTryNow}
              data-testid="button-try-now"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white transition-all"
              style={{ backgroundColor: accentColor, boxShadow: `0 4px 20px ${accentColor}44` }}
            >
              Try Now
            </button>
            <button
              onClick={handleInstall}
              data-testid="button-install"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 bg-card font-medium text-foreground hover:bg-white/5 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Open App
            </button>
          </div>

          {/* Sandbox iframe overlay */}
          <AnimatePresence>
            {sandboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
              >
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="w-full sm:w-[90vw] sm:max-w-5xl h-[90vh] sm:h-[85vh] bg-card rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setSandboxOpen(false)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        data-testid="button-close-sandbox"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={app.url}
                      title={app.name}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs: Reviews / Logbook */}
          <div className="border-b border-border/50 mb-6">
            <div className="flex gap-4">
              {[
                { id: "reviews" as const, label: "Reviews", icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { id: "logbook" as const, label: "Logbook", icon: <BookOpen className="w-3.5 h-3.5" /> },
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
                  {tab.id === "reviews" && reviews && (
                    <span className="ml-1 text-xs text-muted-foreground">({reviews.length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Submit review */}
              {!reviewSubmitted ? (
                <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Leave a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Your nickname</label>
                      <input
                        value={ghostName}
                        onChange={(e) => setGhostName(e.target.value)}
                        placeholder="e.g. pixel_wolf"
                        data-testid="input-ghost-name"
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setVote("up")}
                        data-testid="button-vote-up"
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          vote === "up"
                            ? "bg-green-500/15 border-green-500/40 text-green-400"
                            : "border-border/60 text-muted-foreground hover:border-green-500/30 hover:text-green-400"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Recommend
                      </button>
                      <button
                        onClick={() => setVote("down")}
                        data-testid="button-vote-down"
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          vote === "down"
                            ? "bg-red-500/15 border-red-500/40 text-red-400"
                            : "border-border/60 text-muted-foreground hover:border-red-500/30 hover:text-red-400"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" /> Not for me
                      </button>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience in one line..."
                      maxLength={280}
                      rows={2}
                      data-testid="textarea-comment"
                      className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isBugReport}
                          onChange={(e) => setIsBugReport(e.target.checked)}
                          data-testid="checkbox-bug-report"
                          className="rounded border-border/60 bg-background text-primary"
                        />
                        Flag as bug report
                      </label>
                      <button
                        onClick={handleSubmitReview}
                        disabled={!vote || !comment.trim() || !ghostName.trim() || createReview.isPending}
                        data-testid="button-submit-review"
                        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                      >
                        {createReview.isPending ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm text-center">
                  Review submitted. Thank you!
                </div>
              )}

              {/* Reviews list */}
              {reviews?.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No reviews yet. Be the first!</p>
              )}
              {reviews?.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {activeTab === "logbook" && (
            <div className="space-y-4">
              {logbook?.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No logbook entries yet.</p>
              )}
              {logbook?.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <p className="text-sm text-foreground">{entry.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(entry.createdAt).toLocaleDateString()}
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
