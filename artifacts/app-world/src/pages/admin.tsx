import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Inbox, BarChart3, MessageSquare, ExternalLink,
  Loader2, BookOpen, MessageSquarePlus, Shield
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useGetAdminStats, useGetAdminQueue, useListFeedback, useApproveSubmission,
  useRejectSubmission, useUpdateFeedbackStatus, useCreateLogbookEntry,
  useReplyToReview, useListApps, useListReviews,
  getGetAdminQueueQueryKey, getGetAdminStatsQueryKey, getListFeedbackQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const FEEDBACK_STATUS_STYLE: Record<string, string> = {
  open: "text-amber-400 bg-amber-500/8 border-amber-500/20",
  reviewed: "text-blue-400 bg-blue-500/8 border-blue-500/20",
  resolved: "text-green-400 bg-green-500/8 border-green-500/20",
};

type Tab = "queue" | "feedback" | "logbook" | "replies" | "stats";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [logAppQuery, setLogAppQuery] = useState("");
  const [logAppId, setLogAppId] = useState<number | null>(null);
  const [logAppName, setLogAppName] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logDone, setLogDone] = useState(false);

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
    { id: "queue", label: "Queue", icon: <Inbox className="w-3.5 h-3.5" />, badge: queue?.length },
    { id: "feedback", label: "Feedback", icon: <MessageSquare className="w-3.5 h-3.5" />, badge: feedback?.filter(f => f.status === "open").length },
    { id: "logbook", label: "Logbook", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "replies", label: "Replies", icon: <MessageSquarePlus className="w-3.5 h-3.5" /> },
    { id: "stats", label: "Stats", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Admin</h1>
            <p className="text-sm text-muted-foreground">Platform operations</p>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Pending", value: stats.pendingReviews, color: "text-amber-400" },
              { label: "Live Apps", value: stats.totalApps, color: "text-primary" },
              { label: "Open Feedback", value: stats.openFeedback, color: "text-red-400" },
              { label: "This Week", value: stats.approvedThisWeek, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl border border-border/40 bg-card text-center">
                <div className={`text-2xl font-semibold font-serif ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-border/40 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 pb-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
              {(tab.badge ?? 0) > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Queue */}
        {activeTab === "queue" && (
          <div className="space-y-3">
            {queueLoading
              ? [1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
              : queue?.length === 0
              ? (
                <div className="text-center py-16 rounded-2xl border border-border/30 bg-card/50">
                  <Inbox className="w-7 h-7 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Queue is clear</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending submissions</p>
                </div>
              )
              : queue?.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl border border-border/40 bg-card"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{sub.name}</h3>
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5 truncate"
                      >
                        {sub.url} <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground">Lighthouse</span>
                      <div className={`text-sm font-bold ${sub.lighthouseScore >= 85 ? "text-green-400" : "text-amber-400"}`}>
                        {sub.lighthouseScore}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{sub.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
                    <span className="font-medium text-foreground/70">{sub.category}</span>
                    {sub.uvp && <><span>·</span><span className="italic truncate">{sub.uvp}</span></>}
                  </div>

                  {rejectId === sub.id ? (
                    <div className="flex gap-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive/40"
                      />
                      <button
                        onClick={() => handleReject(sub.id)}
                        disabled={!rejectReason.trim() || reject.isPending}
                        className="px-3 py-2 rounded-xl bg-destructive text-white text-xs font-medium hover:bg-destructive/90 disabled:opacity-50 shrink-0"
                      >
                        {reject.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject"}
                      </button>
                      <button
                        onClick={() => { setRejectId(null); setRejectReason(""); }}
                        className="px-3 py-2 rounded-xl border border-border/60 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={approve.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium hover:bg-green-500/18 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setRejectId(sub.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/8 text-red-400 border border-red-500/18 text-xs font-medium hover:bg-red-500/14 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        )}

        {/* Feedback */}
        {activeTab === "feedback" && (
          <div className="space-y-2.5">
            {feedbackLoading
              ? [1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
              : feedback?.length === 0
              ? (
                <div className="text-center py-12 rounded-2xl border border-border/30 bg-card/50 text-muted-foreground">
                  No feedback yet
                </div>
              )
              : feedback?.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-border/40 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${FEEDBACK_STATUS_STYLE[item.status]}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                        {item.senderName && (
                          <span className="text-xs text-muted-foreground">— {item.senderName}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.message}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {item.status !== "reviewed" && (
                        <button
                          onClick={() => handleFeedbackStatus(item.id, "reviewed")}
                          className="text-[10px] px-2.5 py-1 rounded-lg border border-blue-500/20 text-blue-400 hover:bg-blue-500/8 transition-colors"
                        >
                          Review
                        </button>
                      )}
                      {item.status !== "resolved" && (
                        <button
                          onClick={() => handleFeedbackStatus(item.id, "resolved")}
                          className="text-[10px] px-2.5 py-1 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/8 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Logbook */}
        {activeTab === "logbook" && (
          <div className="max-w-xl space-y-4">
            <p className="text-sm text-muted-foreground">Post a developer update for any listed app.</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Find App</label>
              <input
                value={logAppQuery}
                onChange={(e) => { setLogAppQuery(e.target.value); setLogAppId(null); setLogAppName(""); }}
                placeholder="Search by name..."
                className="w-full px-3 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {logAppQuery.length >= 2 && !logAppId && logSearchResults?.apps && (
                <div className="mt-1.5 rounded-xl border border-border/50 bg-card overflow-hidden">
                  {logSearchResults.apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => { setLogAppId(app.id); setLogAppName(app.name); setLogAppQuery(app.name); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-foreground/4 transition-colors border-b border-border/30 last:border-0"
                    >
                      {app.name}
                      <span className="text-xs text-muted-foreground ml-2">{app.category}</span>
                    </button>
                  ))}
                </div>
              )}
              {logAppId && (
                <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {logAppName}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Update Content</label>
              <textarea
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="Describe what changed, what was fixed, or what's new..."
                rows={4}
                className="w-full px-3 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>
            {logDone && (
              <p className="text-green-400 text-xs flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Entry posted
              </p>
            )}
            <button
              onClick={handlePostLogEntry}
              disabled={!logAppId || !logContent.trim() || createLogEntry.isPending}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {createLogEntry.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : "Post Entry"}
            </button>
          </div>
        )}

        {/* Replies */}
        {activeTab === "replies" && (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Find App</label>
              <input
                value={replyAppQuery}
                onChange={(e) => { setReplyAppQuery(e.target.value); setReplyAppId(null); setReplyAppName(""); }}
                placeholder="Search by name..."
                className="w-full px-3 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {replyAppQuery.length >= 2 && !replyAppId && replySearchResults?.apps && (
                <div className="mt-1.5 rounded-xl border border-border/50 bg-card overflow-hidden">
                  {replySearchResults.apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => { setReplyAppId(app.id); setReplyAppName(app.name); setReplyAppQuery(app.name); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-foreground/4 transition-colors border-b border-border/30 last:border-0"
                    >
                      {app.name}
                    </button>
                  ))}
                </div>
              )}
              {replyAppId && (
                <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {replyAppName}
                </p>
              )}
            </div>

            {replyAppId && (
              <div className="space-y-2.5">
                {!reviewsForReply || reviewsForReply.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-border/30 text-muted-foreground text-sm">
                    No reviews yet.
                  </div>
                ) : reviewsForReply.map((review) => (
                  <div key={review.id} className="p-4 rounded-2xl border border-border/40 bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {review.ghostName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
                      <span className={`text-xs ml-auto ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
                        {review.vote === "up" ? "Recommended" : "Not recommended"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{review.comment}</p>
                    {review.developerReply ? (
                      <div className="pl-3 border-l-2 border-primary/40">
                        <span className="text-[10px] text-primary font-semibold uppercase tracking-wide block mb-1">Reply</span>
                        <p className="text-xs text-muted-foreground">{review.developerReply}</p>
                      </div>
                    ) : repliedIds.has(review.id) ? (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Reply posted
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={replyTexts[review.id] ?? ""}
                          onChange={(e) => setReplyTexts((r) => ({ ...r, [review.id]: e.target.value }))}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyTexts[review.id]?.trim() || replyToReview.isPending}
                          className="px-3 py-2 rounded-xl bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 disabled:opacity-40 transition-colors shrink-0"
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

        {/* Stats */}
        {activeTab === "stats" && stats && (
          <div className="max-w-sm">
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              {[
                { label: "Total Live Apps", value: stats.totalApps },
                { label: "Pending Review", value: stats.pendingReviews },
                { label: "Open Feedback", value: stats.openFeedback },
                { label: "Approved This Week", value: stats.approvedThisWeek },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < 3 ? "border-b border-border/30" : ""}`}
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground font-mono">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
