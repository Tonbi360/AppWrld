import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { useListApps } from "@workspace/api-client-react";
import { useLocation } from "wouter";

const CATEGORIES = ["All", "Productivity", "Design", "Games", "Utilities", "Education", "Social", "Finance", "Health"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "top-rated", label: "Top Rated" },
];

export default function Browse() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [sort, setSort] = useState<"newest" | "trending" | "top-rated">(
    (params.get("sort") as "newest" | "trending" | "top-rated") ?? "newest"
  );
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
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

  const totalPages = data ? Math.ceil(data.total / 18) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Browse Apps</h1>
          <p className="text-muted-foreground">
            {data ? `${data.total.toLocaleString()} apps in the directory` : "Exploring the AppWorld directory"}
          </p>
        </div>

        {/* Search + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or description..."
              data-testid="input-browse-search"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
              data-testid="select-sort"
              className="px-3 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              data-testid={`chip-browse-${cat}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                category === cat
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => <AppCardSkeleton key={i} />)
            : data?.apps?.length === 0
              ? (
                <div className="col-span-3 text-center py-20 text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No apps found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
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
              className="px-4 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground px-3">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
