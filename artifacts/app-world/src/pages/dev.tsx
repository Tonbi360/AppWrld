import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, MessageSquare, CheckCircle, Loader2, AlertCircle, ChevronRight, Code2 } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useListApps, useCreateLogbookEntry, useReplyToReview, useListReviews,
  useListLogbookEntries
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function DevPortal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<{ id: number; name: string; brandColor?: string | null } | null>(null);
  const [activeSection, setActiveSection] = useState<"logbook" | "replies">("logbook");

  const [logEntry, setLogEntry] = useState("");
  const [logDone, setLogDone] = useState(false);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [repliedIds, setRepliedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const { data: searchResults, isFetching } = useListApps(
    { search: query, limit: 8 },
    { query: { enabled: query.length >= 2, queryKey: ["dev-search", query] } }
  );

  const { data: logbookEntries } = useListLogbookEntries(
    { appId: selectedApp?.id ?? 0 },
    { query: { enabled: !!selectedApp, queryKey: ["logbook", selectedApp?.id] } }
  );

  const { data: reviews } = useListReviews(
    { appId: selectedApp?.id ?? 0 },
    { query: { enabled: !!selectedApp, queryKey: ["reviews", selectedApp?.id] } }
  );

  const createEntry = useCreateLogbookEntry();
  const replyToReview = useReplyToReview();

  const handlePostEntry = () => {
    if (!selectedApp || !logEntry.trim()) return;
    setError("");
    createEntry.mutate(
      { data: { appId: selectedApp.id, content: logEntry } },
      {
        onSuccess: () => {
          setLogEntry("");
          setLogDone(true);
          setTimeout(() => setLogDone(false), 3000);
          qc.invalidateQueries({ queryKey: ["logbook", selectedApp.id] });
        },
        onError: () => setError("Failed to post. Please try again."),
      }
    );
  };

  const handleReply = (reviewId: number) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    replyToReview.mutate(
      { id: reviewId, data: { reply: text } },
      {
        onSuccess: () => {
          setRepliedIds((s) => new Set(s).add(reviewId));
          qc.invalidateQueries({ queryKey: ["reviews", selectedApp?.id] });
        },
      }
    );
  };

  const accent = selectedApp?.brandColor ?? "#8b5cf6";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Developer Portal</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === "admin" ? "Admin access" : "Manage your listed apps"}
            </p>
          </div>
        </div>

        {/* App search */}
        <div className="mb-8">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Find your app</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedApp(null); }}
              placeholder="Type the name of your listed PWA..."
              className="w-full pl-10 pr-10 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {isFetching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {query.length >= 2 && searchResults && !selectedApp && (
            <div className="mt-1.5 rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg shadow-black/20">
              {searchResults.apps?.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No apps found for "{query}"
                </div>
              ) : searchResults.apps?.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp({ id: app.id, name: app.name, brandColor: app.brandColor }); setQuery(app.name); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/4 transition-colors text-left border-b border-border/30 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">{app.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{app.category}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected app panel */}
        {selectedApp ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* App banner */}
            <div
              className="flex items-center gap-3 p-4 rounded-2xl mb-6 border"
              style={{ background: `${accent}0d`, borderColor: `${accent}28` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: `${accent}22`, color: accent }}
              >
                {selectedApp.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedApp.name}</p>
                <p className="text-xs text-muted-foreground">Selected</p>
              </div>
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accent }} />
            </div>

            {/* Section tabs */}
            <div className="flex gap-0.5 p-1 rounded-xl bg-muted/50 border border-border/40 mb-6">
              {[
                { id: "logbook" as const, label: "Logbook", icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: "replies" as const, label: "Reviews", icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSection === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Logbook section */}
            {activeSection === "logbook" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-border/40 bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Post an update</h3>
                  <textarea
                    value={logEntry}
                    onChange={(e) => setLogEntry(e.target.value)}
                    placeholder="Share what's new — an update, a fix, a new feature, or a note to your users..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none mb-3"
                  />
                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-xs mb-3">
                      <AlertCircle className="w-3.5 h-3.5" /> {error}
                    </div>
                  )}
                  {logDone && (
                    <div className="flex items-center gap-2 text-green-400 text-xs mb-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Posted
                    </div>
                  )}
                  <button
                    onClick={handlePostEntry}
                    disabled={!logEntry.trim() || createEntry.isPending}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {createEntry.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : "Post Update"}
                  </button>
                </div>

                {/* Past entries */}
                {(logbookEntries?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Past updates</p>
                    {logbookEntries?.map((entry) => (
                      <div key={entry.id} className="p-4 rounded-2xl border border-border/30 bg-card/60">
                        <p className="text-sm text-foreground leading-relaxed">{entry.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Review replies section */}
            {activeSection === "replies" && (
              <div className="space-y-3">
                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-14 text-muted-foreground text-sm border border-border/30 rounded-2xl">
                    No reviews yet for {selectedApp.name}.
                  </div>
                ) : reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-2xl border border-border/40 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {review.ghostName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
                      <span className={`text-xs ml-auto font-medium ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
                        {review.vote === "up" ? "Recommended" : "Not recommended"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{review.comment}</p>

                    {review.developerReply ? (
                      <div className="pl-3 border-l-2 border-primary/40">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide block mb-1">Your Reply</span>
                        <p className="text-xs text-muted-foreground">{review.developerReply}</p>
                      </div>
                    ) : repliedIds.has(review.id) ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Reply posted
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <input
                          value={replyText[review.id] ?? ""}
                          onChange={(e) => setReplyText((r) => ({ ...r, [review.id]: e.target.value }))}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyText[review.id]?.trim() || replyToReview.isPending}
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
          </motion.div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-border/30 bg-card/30">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70 mb-1">Find your listed app above</p>
            <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
