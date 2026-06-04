const KEY = "aw_recently_viewed";
const MAX = 6;

export interface RecentlyViewedEntry {
  id: number;
  name: string;
  category: string;
  iconUrl?: string | null;
  brandColor?: string | null;
  lighthouseScore: number;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentlyViewedEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedEntry[];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(entry: Omit<RecentlyViewedEntry, "viewedAt">) {
  try {
    const current = getRecentlyViewed().filter((e) => e.id !== entry.id);
    const updated = [{ ...entry, viewedAt: Date.now() }, ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
