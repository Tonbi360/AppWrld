import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, CheckCircle, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { useSubmitApp, useScrapeManifest } from "@workspace/api-client-react";

const CATEGORIES = ["Productivity", "Design", "Games", "Utilities", "Education", "Social", "Finance", "Health", "Developer Tools", "Other"];

export default function Submit() {
  const [step, setStep] = useState<"url" | "details" | "done">("url");
  const [url, setUrl] = useState("");
  const [scraped, setScraped] = useState<{
    name?: string | null; description?: string | null; iconUrl?: string | null; brandColor?: string | null;
    hasManifest: boolean; lighthouseScore: number;
  } | null>(null);
  const [form, setForm] = useState({ name: "", description: "", uvp: "", category: "Productivity" });
  const [error, setError] = useState("");

  const scrape = useScrapeManifest();
  const submit = useSubmitApp();

  const handleScrape = async () => {
    if (!url.trim()) return;
    setError("");
    scrape.mutate(
      { data: { url: url.trim() } },
      {
        onSuccess: (data) => {
          setScraped(data);
          setForm((f) => ({
            ...f,
            name: data.name ?? "",
            description: data.description ?? "",
          }));
          setStep("details");
        },
        onError: () => setError("Could not reach that URL. Please check it and try again."),
      }
    );
  };

  const handleSubmit = () => {
    if (!form.uvp.trim() || form.uvp.length > 150) return;
    setError("");
    submit.mutate(
      {
        data: {
          url: url.trim(),
          uvp: form.uvp,
          category: form.category,
          name: form.name || null,
          description: form.description || null,
          iconUrl: scraped?.iconUrl ?? null,
          brandColor: scraped?.brandColor ?? null,
        },
      },
      {
        onSuccess: () => setStep("done"),
        onError: (e: unknown) => {
          const msg = (e as { data?: { error?: string } })?.data?.error ?? "Submission failed. Please try again.";
          setError(msg);
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Submit Your PWA</h1>
          <p className="text-muted-foreground">We review every submission manually. Quality over quantity.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 justify-center mb-10">
          {["URL", "Details", "Done"].map((s, i) => {
            const stepKey = ["url", "details", "done"][i];
            const isActive = step === stepKey;
            const isDone = ["url", "details", "done"].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone ? "bg-primary text-white" : isActive ? "bg-primary/20 text-primary border border-primary/40" : "bg-white/5 text-muted-foreground border border-border/40"
                }`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
              </div>
            );
          })}
        </div>

        <AnimatedCard>
          {step === "url" && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Your PWA URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                    placeholder="https://your-pwa.app"
                    data-testid="input-pwa-url"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">We'll auto-detect your app name, icon, and colors from your manifest.json</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleScrape}
                disabled={!url.trim() || scrape.isPending}
                data-testid="button-scrape"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {scrape.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : "Analyze URL"}
              </button>

              {/* Requirements */}
              <div className="p-4 rounded-xl bg-white/3 border border-border/40">
                <p className="text-xs font-semibold text-foreground mb-2">Submission Requirements</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    "Must have a valid manifest.json (PWA installable)",
                    "Lighthouse score 80+ (auto-checked)",
                    "Must be a web app — not a blog or landing page",
                    "Must have a unique value proposition",
                  ].map((req) => (
                    <li key={req} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">›</span> {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === "details" && scraped && (
            <div className="space-y-5">
              {/* Scraped preview */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                {scraped.iconUrl ? (
                  <img src={scraped.iconUrl} alt="icon" className="w-10 h-10 rounded-xl" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {form.name[0] ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{scraped.hasManifest ? "Manifest detected" : "No manifest"}</p>
                  <p className="text-xs text-muted-foreground">Lighthouse score: {scraped.lighthouseScore}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">App Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="input-app-name"
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  data-testid="textarea-description"
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span>What makes your app unique? <span className="text-destructive">*</span></span>
                  <span className={form.uvp.length > 140 ? "text-amber-400" : ""}>{form.uvp.length}/150</span>
                </label>
                <textarea
                  value={form.uvp}
                  onChange={(e) => setForm((f) => ({ ...f, uvp: e.target.value.slice(0, 150) }))}
                  placeholder="Describe what sets your app apart from similar apps..."
                  maxLength={150}
                  rows={2}
                  data-testid="textarea-uvp"
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  data-testid="select-category"
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("url")}
                  className="flex-1 py-3 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.uvp.trim() || submit.isPending}
                  data-testid="button-submit-app"
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit for Review"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Submission Received</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your app is in the review queue. We'll evaluate it in our next weekly batch. You'll be notified if it goes live.
              </p>
              <button
                onClick={() => { setStep("url"); setUrl(""); setScraped(null); setForm({ name: "", description: "", uvp: "", category: "Productivity" }); }}
                className="mt-4 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Submit Another App
              </button>
            </div>
          )}
        </AnimatedCard>
      </div>
    </Layout>
  );
}

function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-border/60 bg-card"
    >
      {children}
    </motion.div>
  );
}
