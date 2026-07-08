import { Router } from "express";
import { db } from "@workspace/db";
import { appsTable, reviewsTable, logbookTable } from "@workspace/db";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import {
  ListAppsQueryParams,
  TrackAppEventParams,
  TrackAppEventBody,
  CheckIframeSupportParams,
  GetAppParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/apps", async (req, res) => {
  const parsed = ListAppsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { search, category, sort, page = 1, limit = 24 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(appsTable.status, "approved")];
  if (search) {
    conditions.push(
      or(
        ilike(appsTable.name, `%${search}%`),
        ilike(appsTable.description, `%${search}%`)
      )!
    );
  }
  if (category) {
    conditions.push(eq(appsTable.category, category));
  }

  const where = and(...conditions);

  let orderBy;
  if (sort === "trending") {
    orderBy = desc(sql`${appsTable.views} + ${appsTable.tryouts} * 2`);
  } else if (sort === "top-rated") {
    orderBy = desc(appsTable.thumbsUp);
  } else {
    orderBy = desc(appsTable.createdAt);
  }

  try {
    const [apps, [{ count }]] = await Promise.all([
      db.select().from(appsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(appsTable).where(where),
    ]);
    res.json({ apps, total: Number(count), page, limit });
  } catch (err) {
    req.log.error({ err }, "Failed to list apps");
    res.json({ apps: [], total: 0, page, limit });
  }
});

router.get("/apps/featured", async (req, res) => {
  try {
    const apps = await db
      .select()
      .from(appsTable)
      .where(and(eq(appsTable.status, "approved"), eq(appsTable.isFeatured, true)))
      .orderBy(desc(appsTable.isBoosted), desc(appsTable.createdAt))
      .limit(8);
    res.json(apps);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured apps");
    res.json([]);
  }
});

router.get("/apps/stats-summary", async (req, res) => {
  try {
    const [totals] = await db
      .select({
        totalApps: sql<number>`count(*)`,
        totalReviews: sql<number>`(select count(*) from reviews)`,
        totalInstalls: sql<number>`coalesce(sum(${appsTable.installs}), 0)`,
        newThisWeek: sql<number>`count(*) filter (where ${appsTable.createdAt} > now() - interval '7 days')`,
      })
      .from(appsTable)
      .where(eq(appsTable.status, "approved"));

    const topCategories = await db
      .select({
        category: appsTable.category,
        count: sql<number>`count(*)`,
      })
      .from(appsTable)
      .where(eq(appsTable.status, "approved"))
      .groupBy(appsTable.category)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    res.json({
      totalApps: Number(totals.totalApps),
      totalReviews: Number(totals.totalReviews),
      totalInstalls: Number(totals.totalInstalls),
      newThisWeek: Number(totals.newThisWeek),
      topCategories,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats summary");
    res.json({ totalApps: 0, totalReviews: 0, totalInstalls: 0, newThisWeek: 0, topCategories: [] });
  }
});

router.get("/apps/:id", async (req, res) => {
  const parsed = GetAppParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
    if (!app) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    let recentReviews: unknown[] = [];
    let recentLogbook: unknown[] = [];

    try {
      [recentReviews, recentLogbook] = await Promise.all([
        db.select().from(reviewsTable).where(eq(reviewsTable.appId, app.id)).orderBy(desc(reviewsTable.createdAt)).limit(5),
        db.select().from(logbookTable).where(eq(logbookTable.appId, app.id)).orderBy(desc(logbookTable.createdAt)).limit(3),
      ]);
    } catch (err) {
      req.log.error({ err }, "Failed to load reviews/logbook for app");
    }

    res.json({ ...app, recentReviews, recentLogbook });
  } catch (err) {
    req.log.error({ err }, "Failed to get app");
    res.status(500).json({ error: "Failed to load app" });
  }
});

router.post("/apps/:id/track", async (req, res) => {
  const paramsParsed = TrackAppEventParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = TrackAppEventBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { event } = bodyParsed.data;
  const { id } = paramsParsed.data;

  const col =
    event === "view" ? appsTable.views :
    event === "tryout" ? appsTable.tryouts :
    appsTable.installs;

  try {
    await db.update(appsTable).set({ [col.name]: sql`${col} + 1` }).where(eq(appsTable.id, id));
    res.json({ success: true, message: null });
  } catch {
    res.json({ success: true, message: null });
  }
});

router.get("/apps/:id/check-iframe", async (req, res) => {
  const parsed = CheckIframeSupportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
    if (!app) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(app.url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);

      const xfo = response.headers.get("x-frame-options") ?? "";
      const csp = response.headers.get("content-security-policy") ?? "";
      const blocked =
        xfo.toLowerCase().includes("deny") ||
        xfo.toLowerCase().includes("sameorigin") ||
        csp.toLowerCase().includes("frame-ancestors");

      res.json({ supportsIframe: !blocked, url: app.url });
    } catch {
      res.json({ supportsIframe: false, url: app.url });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to check iframe for app");
    res.status(500).json({ error: "Failed to check app" });
  }
});

export default router;
