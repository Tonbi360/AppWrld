import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, XCircle, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { getStatusMeta, SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/status";

interface Submission {
  id: number;
  name: string;
  url: string;
  category: string;
  status: string;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const FLOW_STATUSES: SubmissionStatus[] = [
  "received", "under_review", "needs_info", "confirmed", "in_progress", "fixed", "released"
];

export default function StatusPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => { setSubmission(data); setLoading(false); })
      .catch(() => { setError("Submission not found."); setLoading(false); });
  }, [id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Submission not found</h1>
          <p className="text-sm text-muted-foreground mb-5">This link may be expired or invalid.</p>
          <Link href="/" className="text-sm text-primary hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const meta = getStatusMeta(submission.status);
  const isTerminal = meta.isTerminal;
  const isRejected = submission.status === "rejected" || submission.status === "duplicate";
  const isReleased = submission.status === "released";

  const currentFlowIndex = FLOW_STATUSES.indexOf(submission.status as SubmissionStatus);
  const progressPct = isTerminal
    ? (isReleased ? 100 : 0)
    : Math.round(((currentFlowIndex + 1) / FLOW_STATUSES.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow behind active submissions */}
      {!isTerminal && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, hsl(${
              { received: "220 70% 60%", under_review: "258 85% 65%", needs_info: "38 90% 58%",
                confirmed: "170 70% 50%", in_progress: "210 80% 58%", fixed: "152 65% 48%" }[submission.status] ?? "258 85% 65%"
            } / 0.06) 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />
          AppWorld
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card p-6 mb-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1.5">Submission #{submission.id}</p>
              <h1 className="text-xl font-semibold text-foreground truncate">{submission.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{submission.url}</p>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
          </div>

          {/* Current status */}
          <div className={`${meta.cssClass} inline-flex`}>
            <span className="status-pill">
              <span className={`status-dot ${meta.isActive ? "is-active" : ""}`} />
              {meta.label}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{meta.description}</p>

          {submission.adminNotes && !isRejected && (
            <div className="mt-4 p-3.5 rounded-xl bg-muted/60 border border-border/40">
              <p className="text-xs font-medium text-foreground mb-1">Note from the team</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{submission.adminNotes}</p>
            </div>
          )}

          {isRejected && submission.rejectionReason && (
            <div className="mt-4 p-3.5 rounded-xl bg-destructive/6 border border-destructive/20">
              <p className="text-xs font-medium text-destructive mb-1">Reason</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{submission.rejectionReason}</p>
            </div>
          )}
        </motion.div>

        {/* Progress track (non-terminal only) */}
        {!isTerminal && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-card p-6 mb-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-foreground">Progress</p>
              <span className="text-xs text-muted-foreground">{progressPct}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>

            {/* Status steps */}
            <div className="space-y-3">
              {FLOW_STATUSES.map((s, i) => {
                const sm = getStatusMeta(s);
                const done = i < currentFlowIndex;
                const current = i === currentFlowIndex;
                return (
                  <div key={s} className={`flex items-center gap-3 ${current ? "" : done ? "opacity-60" : "opacity-30"}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      done ? "bg-primary/20 border-primary/40" :
                      current ? `bg-card border-primary/60` :
                      "bg-muted border-border/40"
                    }`}>
                      {done ? (
                        <CheckCircle className="w-3 h-3 text-primary" />
                      ) : current ? (
                        <div className={`${sm.cssClass}`}>
                          <div className={`status-dot ${sm.isActive ? "is-active" : ""}`} />
                        </div>
                      ) : (
                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className={`text-sm ${current ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {sm.label}
                    </span>
                    {current && (
                      <span className="ml-auto text-[11px] text-muted-foreground">Now</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Released state */}
        {isReleased && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
          >
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-base font-semibold text-foreground mb-1">{submission.name} is live</h2>
            <p className="text-sm text-muted-foreground mb-4">This PWA is now part of AppWorld.</p>
            <Link
              href="/browse"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Find it on AppWorld
            </Link>
          </motion.div>
        )}

        {/* Submitted date */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Submitted {new Date(submission.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
