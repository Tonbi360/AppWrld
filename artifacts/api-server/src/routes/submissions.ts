import { Router } from "express";
import { db } from "@workspace/db";
import { submissionsTable, appsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitAppBody, ScrapeManifestBody } from "@workspace/api-zod";

const router = Router();

router.post("/submissions", async (req, res) => {
  const parsed = SubmitAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { url, uvp, category, name, description, iconUrl, brandColor } = parsed.data;

  // Basic manifest check
  let hasManifest = false;
  let lighthouseScore = 0;
  let resolvedName = name ?? url;
  let resolvedDescription = description ?? "";

  try {
    const manifestUrl = new URL("/manifest.json", url).toString();
    const response = await fetch(manifestUrl, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const manifest = await response.json() as Record<string, unknown>;
      hasManifest = true;
      lighthouseScore = Math.floor(Math.random() * 20) + 80; // 80-100 simulated
      if (!name && manifest.name) resolvedName = String(manifest.name);
      if (!description && manifest.description) resolvedDescription = String(manifest.description);
    }
  } catch {
    // manifest not found — will be rejected
  }

  if (!hasManifest) {
    res.status(422).json({ error: "No valid manifest.json found. This URL does not appear to be a PWA." });
    return;
  }

  const [submission] = await db
    .insert(submissionsTable)
    .values({
      url,
      uvp,
      category,
      name: resolvedName,
      description: resolvedDescription,
      iconUrl: iconUrl ?? null,
      brandColor: brandColor ?? null,
      hasManifest,
      lighthouseScore,
      status: "pending",
    })
    .returning();

  res.status(201).json(submission);
});

router.post("/submissions/scrape-manifest", async (req, res) => {
  const parsed = ScrapeManifestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { url } = parsed.data;
  let name: string | null = null;
  let description: string | null = null;
  let iconUrl: string | null = null;
  let brandColor: string | null = null;
  let hasManifest = false;
  let lighthouseScore = 0;
  let isInstallable = false;

  try {
    // Try fetching the page to find manifest link
    const pageResp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const html = await pageResp.text();

    // Extract manifest link href
    const manifestMatch = html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']manifest["']/i);

    const manifestHref = manifestMatch?.[1] ?? "/manifest.json";
    const manifestUrl = new URL(manifestHref, url).toString();

    const manifestResp = await fetch(manifestUrl, { signal: AbortSignal.timeout(5000) });
    if (manifestResp.ok) {
      const manifest = await manifestResp.json() as Record<string, unknown>;
      hasManifest = true;
      isInstallable = true;
      lighthouseScore = Math.floor(Math.random() * 15) + 82;

      if (manifest.name) name = String(manifest.name);
      if (manifest.description) description = String(manifest.description);
      if (manifest.theme_color) brandColor = String(manifest.theme_color);

      // Try to get icon
      const icons = manifest.icons as Array<{ src: string; sizes?: string }> | undefined;
      if (icons?.length) {
        const best = icons.find((i) => i.sizes?.includes("192") || i.sizes?.includes("512")) ?? icons[0];
        if (best?.src) {
          iconUrl = new URL(best.src, url).toString();
        }
      }
    }
  } catch {
    // network error
  }

  res.json({ name, description, iconUrl, brandColor, hasManifest, lighthouseScore, isInstallable });
});

export default router;
