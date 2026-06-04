import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, MessageSquare, CheckCircle, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  useListApps, useCreateLogbookEntry, useReplyToReview, useListReviews,
  useListLogbookEntries
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DevPortal() {
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
        onError: () => setError("Failed to post entry. Please try again."),
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Developer Portal</h1>
              <p className="text-muted-foreground text-sm">Post logbook entries and reply to user reviews</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/6 text-amber-400/80 text-xs leading-relaxed">
            This portal is open to developers whose apps are listed on AppWorld. Find your app below to manage updates and respond to your community.
          </div>
        </div>

        {/* App search */}
        <div className="mb-8">
          <label className="text-sm font-medium text-foreground mb-2 block">Find Your App</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedApp(null); }}
              placeholder="Search your app by name..."
              data-testid="input-dev-search"
              className="w-full pl-10 pr-4 py-3 bg-card border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {isFetching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
          </div>

          {/* Results dropdown */}
          {query.length >= 2 && searchResults && !selectedApp && (
            <div className="mt-2 rounded-xl border border-white/8 bg-card overflow-hidden divide-y divide-white/5">
              {searchResults.apps?.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">No apps found for "{query}"</div>
              ) : searchResults.apps?.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp({ id: app.id, name: app.name, brandColor: app.brandColor }); setQuery(app.name); }}
                  data-testid={`result-app-${app.id}`}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors text-left"
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
        {selectedApp && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* App name banner */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-6 border"
              style={{ background: `${accent}12`, borderColor: `${accent}30` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: `${accent}25`, color: accent }}
              >
                {selectedApp.name[0]}
              </div>
              <span className="font-semibold text-foreground">{selectedApp.name}</span>
              <CheckCircle className="w-4 h-4 ml-auto" style={{ color: accent }} />
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/6 mb-6">
              {[
                { id: "logbook" as const, label: "Logbook", icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: "replies" as const, label: "Review Replies", icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  data-testid={`tab-dev-${tab.id}`}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSection === tab.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Logbook section */}
            {activeSection === "logbook" && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl border border-white/8 bg-card/50">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Post a Logbook Entry</h3>
                  <textarea
                    value={logEntry}
                    onChange={(e) => setLogEntry(e.target.value)}
                    placeholder="Share what's new — an update, a fix, a new feature, or a note to your users..."
                    rows={4}
                    data-testid="textarea-log-entry"
                    className="w-full px-3 py-2.5 bg-background border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none mb-3"
                  />
                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-xs mb-3">
                      <AlertCircle className="w-3.5 h-3.5" /> {error}
                    </div>
                  )}
                  {logDone && (
                    <div className="flex items-center gap-2 text-green-400 text-xs mb-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Entry posted successfully
                    </div>
                  )}
                  <button
                    onClick={handlePostEntry}
                    disabled={!logEntry.trim() || createEntry.isPending}
                    data-testid="button-post-entry"
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {createEntry.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : "Post Entry"}
                  </button>
                </div>

                {/* Past entries */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Entries</h3>
                  {logbookEntries?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-white/5 rounded-xl">
                      No logbook entries yet. Post your first update above.
                    </div>
                  ) : logbookEntries?.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl border border-white/7 bg-card/40 mb-3">
                      <p className="text-sm text-foreground leading-relaxed">{entry.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review replies section */}
            {activeSection === "replies" && (
              <div className="space-y-4">
                {reviews?.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm border border-white/5 rounded-xl">
                    No reviews yet for {selectedApp.name}.
                  </div>
                ) : reviews?.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl border border-white/7 bg-card/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                        {review.ghostName[0]?.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-foreground">{review.ghostName}</span>
                      <span className={`text-xs ml-auto font-medium ${review.vote === "up" ? "text-green-400" : "text-red-400"}`}>
                        {review.vote === "up" ? "Recommended" : "Not recommended"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>

                    {review.developerReply ? (
                      <div className="pl-3 border-l-2 border-primary/50">
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
                          data-testid={`input-reply-${review.id}`}
                          className="flex-1 px-3 py-2 bg-background border border-white/8 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyText[review.id]?.trim() || replyToReview.isPending}
                          data-testid={`button-reply-${review.id}`}
                          className="px-3 py-2 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 disabled:opacity-40 transition-colors flex-shrink-0"
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
        )}

        {/* Empty state before searching */}
        {!selectedApp && query.length < 2 && (
          <div className="text-center py-16 text-muted-foreground border border-white/5 rounded-2xl">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-foreground/60 mb-1">Search for your app above</p>
            <p className="text-sm">Type at least 2 characters to find your listed PWA</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
