import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Inbox, BarChart3, MessageSquare, ExternalLink,
  Loader2, BookOpen, MessageSquarePlus
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useGetAdminStats, useGetAdminQueue, useListFeedback, useApproveSubmission,
  useRejectSubmission, useUpdateFeedbackStatus, useCreateLogbookEntry,
  useReplyToReview, useListApps, useListReviews,
  getGetAdminQueueQueryKey, getGetAdminStatsQueryKey, getListFeedbackQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const FEEDBACK_STATUS: Record<string, string> = {
  open: "text-yellow-400 bg-yellow-500/8 border-yellow-500/20",
  reviewed: "text-blue-400 bg-blue-500/8 border-blue-500/20",
  resolved: "text-green-400 bg-green-500/8 border-green-500/20",
};

type Tab = "queue" | "feedback" | "logbook" | "replies" | "stats";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Logbook state
  const [logAppQuery, setLogAppQuery] = useState("");
  const [logAppId, setLogAppId] = useState<number | null>(null);
  const [logAppName, setLogAppName] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logDone, setLogDone] = useState(false);

  // Replies state
  const [replyAppQuery, setReplyAppQuery] = useState("");
  const [replyAppId, setReplyAppId] = useState<number | null>(null);
  const [replyAppName, setReplyAppName] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [repliedIds, setRepliedIds] = useState<Set<number>>(new Set());

  const qc = useQueryClient();

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: queue, isLoading: queueLoading } = useGetAdminQueue({ query: { queryKey: getGetAdminQueueQueryKey() } });
  const { data: feedback, isLoading: feedbackLoading } = useListFeedback(
    {},
    { query: { queryKey: getListFeedbackQueryKey({}) } }
  );

  const { data: logSearchResults } = useListApps(
    { search: logAppQuery, limit: 6 },
    { query: { enabled: logAppQuery.length >= 2 && !logAppId, queryKey: ["admin-log-search", logAppQuery] } }
  );
  const { data: replySearchResults } = useListApps(
    { search: replyAppQuery, limit: 6 },
    { query: { enabled: replyAppQuery.length >= 2 && !replyAppId, queryKey: ["admin-reply-search", replyAppQuery] } }
  );
  const { data: reviewsForReply } = useListReviews(
    { appId: replyAppId ?? 0 },
    { query: { enabled: !!replyAppId, queryKey: ["admin-reviews", replyAppId] } }
  );

  const approve = useApproveSubmission();
  const reject = useRejectSubmission();
  const updateStatus = useUpdateFeedbackStatus();
  const createLogEntry = useCreateLogbookEntry();
  const replyToReview = useReplyToReview();

  const handleApprove = (id: number) => {
    approve.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAdminQueueQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
    });
  };

  const handleReject = (id: number) => {
    if (!rejectReason.trim()) return;
    reject.mutate({ id, data: { reason: rejectReason } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAdminQueueQueryKey() });
        setRejectId(null);
        setRejectReason("");
      },
    });
  };

  const handleFeedbackStatus = (id: number, status: "open" | "reviewed" | "resolved") => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListFeedbackQueryKey({}) }),
    });
  };

  const handlePostLogEntry = () => {
    if (!logAppId || !logContent.trim()) return;
    createLogEntry.mutate(
      { data: { appId: logAppId, content: logContent } },
      {
        onSuccess: () => {
          setLogContent("");
          setLogDone(true);
          setTimeout(() => setLogDone(false), 3000);
        },
      }
    );
  };

  const handleReply = (reviewId: number) => {
    const text = replyTexts[reviewId];
    if (!text?.trim()) return;
    replyToReview.mutate({ id: reviewId, data: { reply: text } }, {
      onSuccess: () => {
        setRepliedIds((s) => new Set(s).add(reviewId));
        qc.invalidateQueries({ queryKey: ["admin-reviews", replyAppId] });
      },
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "queue", label: "Review Queue", icon: <Inbox className="w-3.5 h-3.5" />, badge: queue?.length },
    { id: "feedback", label: "Feedback", icon: <MessageSquare className="w-3.5 h-3.5" />, badge: feedback?.filter(f => f.status === "open").length },
    { id: "logbook", label: "Post Update", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "replies", label: "Reply to Reviews", icon: <MessageSquarePlus className="w-3.5 h-3.5" /> },
    { id: "stats", label: "Stats", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Admin</h1>
          <p className="text-muted-foreground text-sm">AppWorld curation control panel</p>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Pending", value: stats.pendingReviews, color: "text-amber-400" },
              { label: "Live Apps", value: stats.totalApps, color: "text-primary" },
              { label: "Open Feedback", value: stats.openFeedback, color: "text-red-400" },
              { label: "Approved / Week", value: stats.approvedThisWeek, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl border border-white/6 bg-white/[0.02]">
                <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-white/7 mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-admin-${tab.id}`}
                className={`flex items-center gap-1.5 px-3 pb-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon} {tab.label}
                {(tab.badge ?? 0) > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Queue ── */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {queueLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />) :
             queue?.length === 0 ? (
              <div className="text-center py-16 border border-white/5 rounded-2xl text-muted-foreground">
                <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending submissions</p>
              </div>
            ) : queue?.map((sub) => (
              <motion.div key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-5 rounded-xl border border-white/7 bg-white/[0.02]"
                data-testid={`submission-${sub.id}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{sub.name}</h3>
                    <a href={sub.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                      {sub.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-muted-foreground">Lighthouse </span>
                    <span className={`text-sm font-bold ${sub.lighthouseScore >= 85 ? "text-green-400" : "text-amber-400"}`}>
                      {sub.lighthouseScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{sub.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
                  <span className="text-foreground/60 font-medium">{sub.category}</span>
                  <span>·</span>
                  <span className="italic truncate max-w-xs">{sub.uvp}</span>
                </div>

                {rejectId === sub.id ? (
                  <div className="flex gap-2">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      data-testid={`input-reject-reason-${sub.id}`}
                      className="flex-1 px-3 py-1.5 bg-background border border-white/8 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive/40"
                    />
                    <button onClick={() => handleReject(sub.id)} disabled={!rejectReason.trim() || reject.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-500/80 text-white text-xs hover:bg-red-500 disabled:opacity-50 flex-shrink-0">
                      {reject.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                    </button>
                    <button onClick={() => setRejectId(null)} className="px-3 py-1.5 rounded-lg border border-white/8 text-xs text-muted-foreground flex-shrink-0">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(sub.id)} disabled={approve.isPending}
                      data-testid={`button-approve-${sub.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/12 text-green-400 border border-green-500/20 text-xs font-medium hover:bg-green-500/20 disabled:opacity-50 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => setRejectId(sub.id)}
                      data-testid={`button-reject-${sub.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 text-red-400 border border-red-500/18 text-xs font-medium hover:bg-red-500/15 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Feedback ── */}
        {activeTab === "feedback" && (
          <div className="space-y-3">
            {feedbackLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
             feedback?.length === 0 ? (
              <div className="text-center py-16 border border-white/5 rounded-2xl text-muted-foreground">No feedback yet</div>
            ) : feedback?.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-white/7 bg-white/[0.02]" data-testid={`admin-feedback-${item.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide ${FEEDBACK_STATUS[item.status]}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground capitalize">{item.senderType}</span>
                      {item.senderName && <span className="text-xs text-muted-foreground">— {item.senderName}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {item.status !== "reviewed" && (
                      <button onClick={() => handleFeedbackStatus(item.id, "reviewed")}
                        className="text-[10px] px-2 py-1 rounded border border-blue-500/20 text-blue-400 hover:bg-blue-500/8 transition-colors">
                        Reviewed
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button onClick={() => handleFeedbackStatus(item.id, "resolved")}
                        className="text-[10px] px-2 py-1 rounded border border-green-500/20 text-green-400 hover:bg-green-500/8 transition-colors">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Post Logbook Entry ── */}
        {activeTab === "logbook" && (
          <div className="max-w-xl space-y-5">
            <p className="text-sm text-muted-foreground">Post a developer update (logbook entry) for any listed app.</p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Find App</label>
              <input
                value={logAppQuery}
                onChange={(e) => { setLogAppQuery(e.target.value); setLogAppId(null); setLogAppName(""); }}
                placeholder="Search app by name..."
                className="w-full px-3 py-2.5 bg-card border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              {logAppQuery.length >= 2 && !logAppId && logSearchResults?.apps && (
                <div className="mt-1.5 rounded-xl border border-white/8 bg-card divide-y divide-white/5 overflow-hidden">
                  {logSearchResults.apps.map((app) => (
                    <button key={app.id} onClick={() => { setLogAppId(app.id); setLogAppName(app.name); setLogAppQuery(app.name); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/4 transition-colors">
                      {app.name} <span className="text-xs text-muted-foreground ml-2">{app.category}</span>
                    </button>
                  ))}
                </div>
              )}
              {logAppId && <p className="mt-1.5 text-xs text-green-400">Selected: {logAppName}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Entry Content</label>
              <textarea
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="Describe what changed, what was fixed, or what's new..."
                rows={4}
                data-testid="textarea-admin-log"
                className="w-full px-3 py-2.5 bg-card border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
              />
            </div>

            {logDone && <p className="text-green-400 text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Entry posted</p>}

            <button
              onClick={handlePostLogEntry}
              disabled={!logAppId || !logContent.trim() || createLogEntry.isPending}
              data-testid="button-admin-post-log"
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {createLogEntry.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : "Post Logbook Entry"}
            </button>
          </div>
        )}

        {/* ── Reply to Reviews ── */}
        {activeTab === "replies" && (
          <div className="max-w-2xl space-y-5">
            <p className="text-sm text-muted-foreground">Find an app and reply to user reviews on behalf of its developer.</p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Find App</label>
              <input
                value={replyAppQuery}
                onChange={(e) => { setReplyAppQuery(e.target.value); setReplyAppId(null); setReplyAppName(""); }}
                placeholder="Search app by name..."
                className="w-full px-3 py-2.5 bg-card border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              {replyAppQuery.length >= 2 && !replyAppId && replySearchResults?.apps && (
                <div className="mt-1.5 rounded-xl border border-white/8 bg-card divide-y divide-white/5 overflow-hidden">
                  {replySearchResults.apps.map((app) => (
                    <button key={app.id} onClick={() => { setReplyAppId(app.id); setReplyAppName(app.name); setReplyAppQuery(app.name); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/4 transition-colors">
                      {app.name}
                    </button>
                  ))}
                </div>
              )}
              {replyAppId && <p className="mt-1.5 text-xs text-green-400">Selected: {replyAppName}</p>}
            </div>

            {replyAppId && (
              <div className="space-y-3">
                {!reviewsForReply || reviewsForReply.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-xl text-muted-foreground text-sm">
                    No reviews for this app yet.
                  </div>
                ) : reviewsForReply.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl border border-white/7 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
                      <span className={`text-xs ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
                        {review.vote === "up" ? "Recommended" : "Not recommended"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                    {review.developerReply ? (
                      <div className="pl-3 border-l-2 border-primary/40">
                        <span className="text-[10px] text-primary font-semibold uppercase tracking-wide block mb-1">Reply</span>
                        <p className="text-xs text-muted-foreground">{review.developerReply}</p>
                      </div>
                    ) : repliedIds.has(review.id) ? (
                      <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Reply posted</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={replyTexts[review.id] ?? ""}
                          onChange={(e) => setReplyTexts((r) => ({ ...r, [review.id]: e.target.value }))}
                          placeholder="Write a developer reply..."
                          className="flex-1 px-3 py-2 bg-background border border-white/8 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyTexts[review.id]?.trim() || replyToReview.isPending}
                          className="px-3 py-2 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 disabled:opacity-40 flex-shrink-0"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {activeTab === "stats" && stats && (
          <div className="max-w-xl">
            <div className="p-6 rounded-xl border border-white/7 bg-white/[0.02]">
              <h3 className="font-semibold text-foreground mb-4">Platform Health</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Live Apps", value: stats.totalApps },
                  { label: "Submissions Pending Review", value: stats.pendingReviews },
                  { label: "Open Feedback Items", value: stats.openFeedback },
                  { label: "Apps Approved This Week", value: stats.approvedThisWeek },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-bold text-foreground font-mono">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
