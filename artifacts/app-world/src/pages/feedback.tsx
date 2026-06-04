import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, CheckCircle, Loader2, Bug, Lightbulb, AlertTriangle, Heart } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { useSubmitFeedback, useListFeedback } from "@workspace/api-client-react";

const TYPES = [
  { value: "suggestion", label: "Suggestion", icon: <Lightbulb className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" },
  { value: "bug", label: "Bug Report", icon: <Bug className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
  { value: "complaint", label: "Complaint", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/25" },
  { value: "praise", label: "Praise", icon: <Heart className="w-4 h-4" />, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/25" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function Feedback() {
  const [form, setForm] = useState({
    type: "suggestion" as "suggestion" | "bug" | "complaint" | "praise",
    message: "",
    senderType: "user" as "user" | "developer",
    senderName: "",
    contactEmail: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitFeedback = useSubmitFeedback();
  const { data: feedbackList, isLoading } = useListFeedback(
    { status: "open" },
    { query: { queryKey: ["feedback", "open"] } }
  );

  const handleSubmit = () => {
    if (!form.message.trim()) return;
    setError("");
    submitFeedback.mutate(
      {
        data: {
          type: form.type,
          message: form.message,
          senderType: form.senderType,
          senderName: form.senderName || null,
          contactEmail: form.contactEmail || null,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError("Something went wrong. Please try again."),
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <MessageSquarePlus className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Share Your Feedback</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your feedback shapes AppWorld. Whether you're a user or developer, we want to hear it — bugs, ideas, complaints, or kudos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-border/60 bg-card"
          >
            {!submitted ? (
              <div className="space-y-5">
                {/* Type selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        data-testid={`button-type-${t.value}`}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          form.type === t.value ? `${t.bg} ${t.color}` : "border-border/40 text-muted-foreground hover:bg-white/3"
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">I am a...</label>
                  <div className="flex gap-2">
                    {["user", "developer"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm((f) => ({ ...f, senderType: s as "user" | "developer" }))}
                        data-testid={`button-sender-${s}`}
                        className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                          form.senderType === s
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "border-border/40 text-muted-foreground hover:bg-white/3"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your feedback in detail..."
                    rows={4}
                    data-testid="textarea-feedback"
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (optional)</label>
                    <input
                      value={form.senderName}
                      onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
                      placeholder="Your name"
                      data-testid="input-sender-name"
                      className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email (optional)</label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                      placeholder="you@example.com"
                      data-testid="input-contact-email"
                      className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/25">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!form.message.trim() || submitFeedback.isPending}
                  data-testid="button-submit-feedback"
                  className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {submitFeedback.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Feedback"}
                </button>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">Feedback Sent</h3>
                <p className="text-muted-foreground text-sm">Thanks for helping make AppWorld better.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ type: "suggestion", message: "", senderType: "user", senderName: "", contactEmail: "" }); }}
                  className="mt-2 px-4 py-2 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Send More Feedback
                </button>
              </div>
            )}
          </motion.div>

          {/* Recent open feedback */}
          <div>
            <h2 className="font-semibold text-foreground mb-4 text-sm">Recent Feedback</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : feedbackList?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-border/40 rounded-xl">
                No open feedback yet
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList?.map((item) => {
                  const type = TYPES.find((t) => t.value === item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl border border-border/50 bg-card/50"
                      data-testid={`feedback-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${type?.bg} ${type?.color}`}>
                          {type?.icon} {type?.label}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[item.status]}`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto capitalize">{item.senderType}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                      {item.senderName && (
                        <p className="text-xs text-muted-foreground/60 mt-1">— {item.senderName}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
