import { motion } from "framer-motion";
import { Search, ArrowRight, Zap, Globe, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { useGetFeaturedApps, useGetAppStatsSummary, useListApps } from "@workspace/api-client-react";
import { useNavigate } from "@/lib/use-navigate";

const CATEGORIES = ["All", "Productivity", "Design", "Games", "Utilities", "Education"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Premium PWA Discovery
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
              Discover the web's{" "}
              <span className="text-primary">best apps</span>
              <br />without an app store
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              AppWorld is the exclusive directory for Progressive Web Apps. Try any app instantly — no download, no account, no friction.
            </p>
          </motion.div>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSearch}
            className="flex items-center gap-2 max-w-xl mx-auto mb-6"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PWAs..."
                data-testid="input-search"
                className="w-full pl-10 pr-4 py-3 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              data-testid="button-search-submit"
              className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </motion.form>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => cat === "All" ? goTo("/browse") : goTo(`/browse?category=${cat}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-white/5 transition-all"
                data-testid={`chip-category-${cat}`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="border-y border-border/40 bg-card/50 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Apps Listed", value: stats.totalApps?.toLocaleString() ?? "0" },
                { label: "Total Installs", value: stats.totalInstalls?.toLocaleString() ?? "0" },
                { label: "Reviews", value: stats.totalReviews?.toLocaleString() ?? "0" },
                { label: "New This Week", value: stats.newThisWeek?.toLocaleString() ?? "0" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold font-serif text-foreground" data-testid={`stat-${stat.label}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured apps */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Featured</h2>
              <p className="text-muted-foreground text-sm mt-1">Hand-picked by the AppWorld team</p>
            </div>
            <button
              onClick={() => goTo("/browse?sort=newest")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              data-testid="link-see-all-featured"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <AppCardSkeleton key={i} />)
              : featured?.map((app, i) => <AppCard key={app.id} app={app} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Trending Now</h2>
            </div>
            <button
              onClick={() => goTo("/browse?sort=trending")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              data-testid="link-see-all-trending"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingLoading
              ? Array.from({ length: 6 }).map((_, i) => <AppCardSkeleton key={i} />)
              : trending?.apps?.map((app, i) => <AppCard key={app.id} app={app} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Built a great PWA?</h2>
          <p className="text-muted-foreground mb-8">Submit your app for curation. We review every submission manually for quality and uniqueness.</p>
          <button
            onClick={() => goTo("/submit")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            data-testid="button-submit-cta"
          >
            Submit Your App <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </Layout>
  );
}
