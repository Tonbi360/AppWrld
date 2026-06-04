import { motion } from "framer-motion";
import { Search, ArrowRight, Zap, Globe, TrendingUp, Layers } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { useGetFeaturedApps, useGetAppStatsSummary, useListApps } from "@workspace/api-client-react";
import { useNavigate } from "@/lib/use-navigate";

const CATEGORIES = ["Productivity", "Design", "Games", "Utilities", "Education", "Developer Tools"];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-serif text-2xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const { goTo } = useNavigate();

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedApps();
  const { data: stats } = useGetAppStatsSummary();
  const { data: trending, isLoading: trendingLoading } = useListApps(
    { sort: "trending", limit: 6 },
    { query: { queryKey: ["listApps", "trending"] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) goTo(`/browse?search=${encodeURIComponent(search.trim())}`);
    else goTo("/browse");
  };

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        {/* Background glow mesh */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-[60px] right-[10%] w-[200px] h-[200px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-medium mb-8">
              <Zap className="w-3 h-3" />
              The exclusive PWA directory
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-foreground">Discover apps</span>
              <br />
              <span style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                without an app store
              </span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              AppWorld curates Progressive Web Apps — try any of them instantly in your browser. No download. No account. No friction.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onSubmit={handleSearch}
            className="relative max-w-lg mx-auto mb-8 group"
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm focus-within:border-primary/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PWAs by name or category..."
                data-testid="input-search"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1.5"
              />
              <button
                type="submit"
                data-testid="button-search-submit"
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => goTo(`/browse?category=${encodeURIComponent(cat)}`)}
                data-testid={`chip-category-${cat}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/8 text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/4 transition-all"
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      {stats && (
        <section className="border-y border-white/5 bg-white/[0.015]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
              <StatPill label="Apps Listed" value={stats.totalApps?.toLocaleString() ?? "0"} />
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <StatPill label="Total Installs" value={stats.totalInstalls?.toLocaleString() ?? "0"} />
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <StatPill label="Reviews" value={stats.totalReviews?.toLocaleString() ?? "0"} />
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <StatPill label="New This Week" value={stats.newThisWeek?.toLocaleString() ?? "0"} />
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Featured</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Hand-picked by the AppWorld team</p>
            </div>
            <button
              onClick={() => goTo("/browse?sort=newest")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Editorial grid: first app is hero (col-span-2), rest are normal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredLoading ? (
              <>
                <AppCardSkeleton hero />
                {Array.from({ length: 3 }).map((_, i) => <AppCardSkeleton key={i} />)}
              </>
            ) : featured?.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-muted-foreground border border-white/5 rounded-2xl">
                <Globe className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No featured apps yet</p>
                <p className="text-sm mt-1">Check back soon — the team is curating.</p>
              </div>
            ) : (
              <>
                {featured?.[0] && <AppCard app={featured[0]} hero index={0} />}
                {featured?.slice(1).map((app, i) => <AppCard key={app.id} app={app} index={i + 1} />)}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Trending ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Trending Now</h2>
                <p className="text-muted-foreground text-sm">Most visited in the last 7 days</p>
              </div>
            </div>
            <button
              onClick={() => goTo("/browse?sort=trending")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Browse all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingLoading
              ? Array.from({ length: 6 }).map((_, i) => <AppCardSkeleton key={i} />)
              : trending?.apps?.length === 0
                ? (
                  <div className="col-span-3 text-center py-16 text-muted-foreground border border-white/5 rounded-2xl">
                    <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>Nothing trending yet — apps gain traction as users visit and try them.</p>
                  </div>
                )
                : trending?.apps?.map((app, i) => <AppCard key={app.id} app={app} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Built a great PWA?</h2>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            Submit your app for curation. Every submission is reviewed manually — we prioritize quality over quantity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => goTo("/submit")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-submit-cta"
            >
              Submit Your App <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goTo("/dev")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 font-medium transition-colors"
            >
              Developer Portal
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
