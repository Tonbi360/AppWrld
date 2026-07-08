import { Router, type Request, type Response } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getVapidConfig() {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:admin@appworld.app";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function initWebPush() {
  const config = getVapidConfig();
  if (!config) return false;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

router.get("/push/vapid-public-key", (_req: Request, res: Response) => {
  const config = getVapidConfig();
  if (!config) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: config.publicKey });
});

router.post("/push/subscribe", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  try {
    await db
      .insert(pushSubscriptionsTable)
      .values({
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          userId: req.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });

    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save push subscription");
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

router.delete("/push/subscribe", async (req: Request, res: Response) => {
  const { endpoint } = req.body ?? {};
  if (!endpoint) {
    res.status(400).json({ error: "Missing endpoint" });
    return;
  }

  try {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove push subscription");
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!initWebPush()) return;

  let subs: typeof pushSubscriptionsTable.$inferSelect[] = [];
  try {
    subs = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
  } catch {
    return;
  }

  const payloadStr = JSON.stringify(payload);
  const dead: number[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          dead.push(sub.id);
        }
      }
    })
  );

  if (dead.length) {
    await Promise.allSettled(
      dead.map((id) => db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, id)))
    );
  }
}

export default router;
