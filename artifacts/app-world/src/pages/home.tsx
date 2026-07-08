import { motion } from "framer-motion";
import { Search, ArrowRight, Globe, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { useGetFeaturedApps, useGetAppStatsSummary, useListApps } from "@workspace/api-client-react";
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedEntry } from "@/lib/recently-viewed";

const CATEGORIES = ["Productivity", "Design", "Games", "Utilities", "Education", "Social", "Finance", "Developer Tools"];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-lg font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function RecentlyViewedCard({ entry, onRemove }: { entry: RecentlyViewedEntry; onRemove: () => void }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(`/app/${entry.id}`)}
      className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-border/70 transition-all text-left min-w-[180px]"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-foreground/10"
      >
        <X className="w-2.5 h-2.5 text-muted-foreground" />
      </button>
      {entry.iconUrl ? (
        <img src={entry.iconUrl} alt={entry.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{entry.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{entry.category}</p>
      </div>
    </button>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>(() => getRecentlyViewed());

  const { data: stats } = useGetAppStatsSummary();
  const { data: featuredData, isLoading: featuredLoading } = useGetFeaturedApps();
  const { data: trendingData, isLoading: trendingLoading } = useListApps({
    sort: "trending", limit: 6, page: 1,
  });

  const featured = featuredData ?? [];
  const trending = trendingData?.apps ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?q=${encodeURIComponent(search.trim())}`);
    else navigate("/browse");
  }

  function removeRecent(id: number) {
    const updated = recentlyViewed.filter((r) => r.id !== id);
    setRecentlyViewed(updated);
    localStorage.setItem("aw_recently_viewed", JSON.stringify(updated));
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-16 pb-14 px-4 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-80 pointer-events-none select-none">
          <div className="w-full h-full rounded-full bg-primary/7 blur-[90px]" />
        </div>

        <div className="max-w-xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-primary/22 bg-primary/8 text-primary mb-6">
              <Sparkles className="w-3 h-3" />
              The PWA discovery platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="font-serif text-[2.6rem] sm:text-5xl font-semibold tracking-tight text-foreground text-balance leading-[1.1] mb-4"
          >
            Discover what<br />
            <span className="text-primary">the web can do.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="text-[15px] text-muted-foreground text-balance leading-relaxed mb-8 max-w-md mx-auto"
          >
            Browse, test-drive, and review Progressive Web Apps — no app store required.
          </motion.p>

          {/* Search */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="flex gap-2 max-w-md mx-auto mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PWAs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[.97] transition-all shrink-0"
            >
              Search
            </button>
          </motion.form>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="flex flex-wrap justify-center gap-1.5"
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/browse?category=${encodeURIComponent(cat)}`}
                className="px-3 py-1 rounded-full text-[11px] font-medium border border-border/50 bg-card/80 text-muted-foreground hover:text-foreground hover:border-border hover:bg-card transition-colors"
              >
                {cat}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="border-y border-border/30 bg-card/40 py-4">
          <div className="max-w-xl mx-auto px-4 flex items-center justify-center gap-8">
            <StatPill value={stats.totalApps.toLocaleString()} label="PWAs listed" />
            <div className="w-px h-6 bg-border/40" />
            <StatPill value={stats.totalInstalls.toLocaleString()} label="test-drives" />
            <div className="w-px h-6 bg-border/40" />
            <StatPill value={stats.totalReviews.toLocaleString()} label="reviews" />
            {stats.newThisWeek > 0 && (
              <>
                <div className="w-px h-6 bg-border/40" />
                <StatPill value={`+${stats.newThisWeek}`} label="this week" />
              </>
            )}
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="pt-10 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recently viewed</h2>
              <button
                onClick={() => { clearRecentlyViewed(); setRecentlyViewed([]); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {recentlyViewed.map((entry) => (
                <RecentlyViewedCard
                  key={entry.id}
                  entry={entry}
                  onRemove={() => removeRecent(entry.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        <section className="py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Featured</h2>
            <Link href="/browse" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <AppCardSkeleton key={i} />)}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-sm text-muted-foreground">No featured apps yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.slice(0, 3).map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                >
                  <AppCard app={app} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Trending */}
        <section className="pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Trending</h2>
            <Link href="/browse?sort=trending" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <AppCardSkeleton key={i} />)}
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-border/30 bg-card/50">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No apps yet</p>
              <p className="text-xs text-muted-foreground mb-5">Be the first to submit a PWA.</p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Submit PWA
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trending.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <AppCard app={app} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Developer CTA */}
        <section className="pb-14">
          <div className="rounded-2xl border border-primary/14 bg-primary/4 px-8 py-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Built a PWA?</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              List it on AppWorld and reach users who are actively looking for web-native experiences.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Submit your PWA <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
