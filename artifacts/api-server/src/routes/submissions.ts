import { Router } from "express";
import { db } from "@workspace/db";
import { submissionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitAppBody, ScrapeManifestBody } from "@workspace/api-zod";
import { calculatePwaReadiness, fetchPublicUrl, readResponseText } from "../lib/urlSafety";

const router = Router();

async function detectManifest(url: string): Promise<{
  hasManifest: boolean;
  name: string | null;
  description: string | null;
  iconUrl: string | null;
  brandColor: string | null;
  lighthouseScore: number;
}> {
  let hasManifest = false;
  let name: string | null = null;
  let description: string | null = null;
  let iconUrl: string | null = null;
  let brandColor: string | null = null;
  let lighthouseScore = 0;

  try {
    const pageResp = await fetchPublicUrl(url, 7000);
    const html = await readResponseText(pageResp);

    const manifestMatch =
      html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i) ??
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']manifest["']/i);

    const manifestHref = manifestMatch?.[1] ?? "/manifest.json";
    const manifestUrl = new URL(manifestHref, url).toString();

    const manifestResp = await fetchPublicUrl(manifestUrl, 5000);
    if (manifestResp.ok) {
      const manifest = JSON.parse(await readResponseText(manifestResp)) as Record<string, unknown>;
      hasManifest = true;
      lighthouseScore = calculatePwaReadiness(manifest);

      if (manifest.name) name = String(manifest.name);
      if (manifest.description) description = String(manifest.description);
      if (manifest.theme_color) brandColor = String(manifest.theme_color);

      const icons = manifest.icons as Array<{ src: string; sizes?: string }> | undefined;
      if (icons?.length) {
        const best = icons.find((i) => i.sizes?.includes("192") || i.sizes?.includes("512")) ?? icons[0];
        if (best?.src) iconUrl = new URL(best.src, url).toString();
      }
    }
  } catch {
    // network/parse error — try direct manifest.json as fallback
    try {
      const manifestUrl = new URL("/manifest.json", url).toString();
      const resp = await fetchPublicUrl(manifestUrl, 4000);
      if (resp.ok) {
        const manifest = JSON.parse(await readResponseText(resp)) as Record<string, unknown>;
        hasManifest = true;
        lighthouseScore = calculatePwaReadiness(manifest);
        if (manifest.name) name = String(manifest.name);
        if (manifest.description) description = String(manifest.description);
        if (manifest.theme_color) brandColor = String(manifest.theme_color);
      }
    } catch {
      // still no manifest
    }
  }

  return { hasManifest, name, description, iconUrl, brandColor, lighthouseScore };
}

router.get("/submissions/mine", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const subs = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.submitterId, req.user.id))
      .orderBy(desc(submissionsTable.createdAt));
    res.json(subs);
  } catch (err) {
    req.log.error({ err }, "Failed to load user submissions");
    res.json([]);
  }
});

router.get("/submissions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, id));
    if (!submission) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to get submission");
    res.status(500).json({ error: "Failed to load submission" });
  }
});

router.post("/submissions", async (req, res) => {
  const parsed = SubmitAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { url, uvp, category, name, description, iconUrl, brandColor } = parsed.data;
  const submitterId = req.isAuthenticated() ? req.user.id : null;

  const detected = await detectManifest(url);

  if (!detected.hasManifest) {
    res.status(422).json({ error: "No valid web app manifest found. Make sure this URL is a Progressive Web App." });
    return;
  }

  const resolvedName = name ?? detected.name ?? url;
  const resolvedDescription = description ?? detected.description ?? "";
  const resolvedIconUrl = iconUrl ?? detected.iconUrl ?? null;
  const resolvedBrandColor = brandColor ?? detected.brandColor ?? null;

  try {
    const [submission] = await db
      .insert(submissionsTable)
      .values({
        url,
        uvp,
        category,
        name: resolvedName,
        description: resolvedDescription,
        iconUrl: resolvedIconUrl,
        brandColor: resolvedBrandColor,
        hasManifest: true,
        lighthouseScore: detected.lighthouseScore,
        status: "received",
        submitterId,
      })
      .returning();

    res.status(201).json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to create submission");
    res.status(500).json({ error: "Failed to submit app" });
  }
});

router.post("/submissions/scrape-manifest", async (req, res) => {
  const parsed = ScrapeManifestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const result = await detectManifest(parsed.data.url);
  res.json({
    name: result.name,
    description: result.description,
    iconUrl: result.iconUrl,
    brandColor: result.brandColor,
    hasManifest: result.hasManifest,
    lighthouseScore: result.lighthouseScore,
    isInstallable: result.hasManifest,
  });
});

export default router;
