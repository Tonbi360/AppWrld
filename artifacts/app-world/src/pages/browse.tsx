import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/layout";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { useListApps } from "@workspace/api-client-react";

const CATEGORIES = ["All", "Productivity", "Design", "Games", "Utilities", "Education", "Social", "Finance", "Health", "Developer Tools"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "top-rated", label: "Top Rated" },
];

export default function Browse() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [sort, setSort] = useState<"newest" | "trending" | "top-rated">(
    (params.get("sort") as "newest" | "trending" | "top-rated") ?? "newest"
  );
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category !== "All" ? { category } : {}),
    sort,
    page,
    limit: 18,
  };

  const { data, isLoading } = useListApps(queryParams, {
    query: { queryKey: ["listApps", "browse", debouncedSearch, category, sort, page] },
  });

  const totalPages = data ? Math.ceil((data.total ?? 0) / 18) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Browse Apps</h1>
          <p className="text-muted-foreground text-sm">
            {data
              ? `${data.total.toLocaleString()} app${data.total !== 1 ? "s" : ""} in the directory`
              : "Exploring the AppWorld directory"}
          </p>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description..."
              data-testid="input-browse-search"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-white/8 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
              data-testid="select-sort"
              className="px-3 py-2.5 bg-card border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer appearance-none pr-8"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='rgba(255,255,255,0.3)'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              data-testid={`chip-browse-${cat}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                category === cat
                  ? "bg-primary/15 border-primary/35 text-primary"
                  : "border-white/8 text-muted-foreground hover:text-foreground hover:border-white/16 hover:bg-white/4"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && data && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mb-4"
          >
            {debouncedSearch
              ? `${data.total} result${data.total !== 1 ? "s" : ""} for "${debouncedSearch}"`
              : category !== "All"
                ? `${data.total} app${data.total !== 1 ? "s" : ""} in ${category}`
                : null
            }
          </motion.p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => <AppCardSkeleton key={i} />)
            : data?.apps?.length === 0
              ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-24 text-muted-foreground border border-white/5 rounded-2xl">
                  <Search className="w-10 h-10 mb-4 opacity-20" />
                  <p className="font-medium text-foreground/50 text-lg mb-1">No apps found</p>
                  <p className="text-sm">Try different keywords or clear the filters</p>
                  <button
                    onClick={() => { setSearch(""); setCategory("All"); setPage(1); }}
                    className="mt-5 px-4 py-2 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground hover:border-white/16 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )
              : data?.apps?.map((app, i) => <AppCard key={app.id} app={app} index={i} />)
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground hover:border-white/16 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground hover:border-white/16 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
