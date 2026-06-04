import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Inbox, BarChart3, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useGetAdminStats, useGetAdminQueue, useListFeedback, useApproveSubmission,
  useRejectSubmission, useUpdateFeedbackStatus,
  getGetAdminQueueQueryKey, getGetAdminStatsQueryKey, getListFeedbackQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const FEEDBACK_STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  reviewed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  resolved: "text-green-400 bg-green-500/10 border-green-500/20",
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"queue" | "feedback" | "stats">("queue");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const qc = useQueryClient();

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: queue, isLoading: queueLoading } = useGetAdminQueue({ query: { queryKey: getGetAdminQueueQueryKey() } });
  const { data: feedback, isLoading: feedbackLoading } = useListFeedback(
    {},
    { query: { queryKey: getListFeedbackQueryKey({}) } }
  );

  const approve = useApproveSubmission();
  const reject = useRejectSubmission();
  const updateStatus = useUpdateFeedbackStatus();

  const handleApprove = (id: number) => {
    approve.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetAdminQueueQueryKey() }),
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">AppWorld curation control panel</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Pending Reviews", value: stats.pendingReviews, color: "text-amber-400" },
              { label: "Live Apps", value: stats.totalApps, color: "text-primary" },
              { label: "Open Feedback", value: stats.openFeedback, color: "text-red-400" },
              { label: "Approved This Week", value: stats.approvedThisWeek, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-border/50 bg-card/50 text-center">
                <div className={`text-2xl font-bold font-serif ${s.color}`} data-testid={`stat-admin-${s.label}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border/50 mb-6">
          <div className="flex gap-4">
            {[
              { id: "queue" as const, label: "Review Queue", icon: <Inbox className="w-3.5 h-3.5" />, count: queue?.length },
              { id: "feedback" as const, label: "Feedback", icon: <MessageSquare className="w-3.5 h-3.5" />, count: feedback?.filter(f => f.status === "open").length },
              { id: "stats" as const, label: "Overview", icon: <BarChart3 className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-admin-${tab.id}`}
                className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Review Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {queueLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
            ) : queue?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-border/40 rounded-xl">
                <Inbox className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No pending submissions</p>
              </div>
            ) : queue?.map((submission) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 rounded-xl border border-border/50 bg-card/50"
                data-testid={`submission-${submission.id}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{submission.name}</h3>
                    <a href={submission.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      {submission.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">Lighthouse: </span>
                    <span className={`text-xs font-bold ${submission.lighthouseScore >= 85 ? "text-green-400" : "text-amber-400"}`}>
                      {submission.lighthouseScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{submission.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-muted-foreground">Category:</span>
                  <span className="text-[10px] text-foreground font-medium">{submission.category}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">UVP:</span>
                  <span className="text-[10px] text-foreground/80 italic truncate max-w-xs">{submission.uvp}</span>
                </div>

                {rejectId === submission.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason..."
                      data-testid={`input-reject-reason-${submission.id}`}
                      className="flex-1 px-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive/60"
                    />
                    <button
                      onClick={() => handleReject(submission.id)}
                      disabled={!rejectReason.trim() || reject.isPending}
                      className="px-3 py-1.5 rounded-lg bg-destructive/80 text-white text-xs hover:bg-destructive disabled:opacity-50"
                    >
                      {reject.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject"}
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground text-xs hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      disabled={approve.isPending}
                      data-testid={`button-approve-${submission.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectId(submission.id)}
                      data-testid={`button-reject-${submission.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Feedback tab */}
        {activeTab === "feedback" && (
          <div className="space-y-3">
            {feedbackLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
            ) : feedback?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-border/40 rounded-xl">No feedback yet</div>
            ) : feedback?.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-border/50 bg-card/50" data-testid={`admin-feedback-${item.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium capitalize ${FEEDBACK_STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground capitalize">{item.senderType}</span>
                      {item.senderName && <span className="text-xs text-muted-foreground">— {item.senderName}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {item.status !== "reviewed" && (
                      <button
                        onClick={() => handleFeedbackStatus(item.id, "reviewed")}
                        className="text-[10px] px-2 py-1 rounded border border-blue-500/25 text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        Mark Reviewed
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button
                        onClick={() => handleFeedbackStatus(item.id, "resolved")}
                        className="text-[10px] px-2 py-1 rounded border border-green-500/25 text-green-400 hover:bg-green-500/10 transition-colors"
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

        {/* Stats overview */}
        {activeTab === "stats" && stats && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <h3 className="font-semibold text-foreground mb-4">Platform Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Live Apps", value: stats.totalApps },
                  { label: "Submissions Pending", value: stats.pendingReviews },
                  { label: "Open Feedback Items", value: stats.openFeedback },
                  { label: "Apps Approved This Week", value: stats.approvedThisWeek },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold text-foreground font-mono">{row.value}</span>
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
