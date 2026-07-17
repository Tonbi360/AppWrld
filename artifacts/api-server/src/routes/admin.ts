import { Router } from "express";
import { db } from "@workspace/db";
import { submissionsTable, appsTable, feedbackTable, usersTable, reviewsTable, logbookTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ApproveSubmissionParams,
  RejectSubmissionParams,
  RejectSubmissionBody,
} from "@workspace/api-zod";
import { sendPushToUser } from "./push";

const router = Router();

router.get("/admin/queue", async (req, res) => {
  try {
    const queue = await db
      .select()
      .from(submissionsTable)
      .where(
        sql`${submissionsTable.status} NOT IN ('approved', 'rejected')`
      )
      .orderBy(desc(submissionsTable.createdAt));
    // Backwards-compatible alias for the new metric name
    const mapped = queue.map((q) => ({ ...q, pwaReadiness: (q as any).lighthouseScore ?? 0 }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to get admin queue");
    res.json([]);
  }
});

router.post("/admin/submissions/:id/approve", async (req, res) => {
  const parsed = ApproveSubmissionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, parsed.data.id));

    if (!submission) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    await Promise.all([
      db
        .update(submissionsTable)
        .set({ status: "approved" })
        .where(eq(submissionsTable.id, parsed.data.id)),
      db.insert(appsTable).values({
        name: submission.name,
        description: submission.description,
        uvp: submission.uvp,
        url: submission.url,
        iconUrl: submission.iconUrl,
        brandColor: submission.brandColor,
        category: submission.category,
        lighthouseScore: submission.lighthouseScore,
        hasOfflineSupport: false,
        hasPushNotifications: false,
        isInstallable: submission.hasManifest,
        status: "approved",
      }),
    ]);

    if (submission.submitterId) {
      sendPushToUser(submission.submitterId, {
        title: "Your app is live!",
        body: `${submission.name} has been approved and is now in the AppWorld directory.`,
        url: `/status/${submission.id}`,
      }).catch(() => {});
    }

    res.json({ success: true, message: "Submission approved and app is now live." });
  } catch (err) {
    req.log.error({ err }, "Failed to approve submission");
    res.status(500).json({ error: "Failed to approve submission" });
  }
});

router.post("/admin/submissions/:id/reject", async (req, res) => {
  const paramsParsed = RejectSubmissionParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = RejectSubmissionBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const [updated] = await db
      .update(submissionsTable)
      .set({ status: "rejected", rejectionReason: bodyParsed.data.reason })
      .where(eq(submissionsTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    if (updated.submitterId) {
      sendPushToUser(updated.submitterId, {
        title: "Submission update",
        body: `${updated.name} was not approved at this time.`,
        url: `/status/${updated.id}`,
      }).catch(() => {});
    }

    res.json({ success: true, message: "Submission rejected." });
  } catch (err) {
    req.log.error({ err }, "Failed to reject submission");
    res.status(500).json({ error: "Failed to reject submission" });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const [[pendingRow], [totalRow], [feedbackRow], [weekRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(submissionsTable).where(
        sql`${submissionsTable.status} NOT IN ('approved', 'rejected')`
      ),
      db.select({ count: sql<number>`count(*)` }).from(appsTable).where(eq(appsTable.status, "approved")),
      db.select({ count: sql<number>`count(*)` }).from(feedbackTable).where(eq(feedbackTable.status, "open")),
      db.select({ count: sql<number>`count(*)` }).from(appsTable).where(
        sql`${appsTable.status} = 'approved' AND ${appsTable.createdAt} > now() - interval '7 days'`
      ),
    ]);

    res.json({
      pendingReviews: Number(pendingRow.count),
      totalApps: Number(totalRow.count),
      openFeedback: Number(feedbackRow.count),
      approvedThisWeek: Number(weekRow.count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.json({ pendingReviews: 0, totalApps: 0, openFeedback: 0, approvedThisWeek: 0 });
  }
});

router.get("/admin/users", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        role: usersTable.role,
        authProvider: usersTable.authProvider,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(200);
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.json([]);
  }
});

router.patch("/admin/users/:id/role", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { role } = req.body as { role: unknown };
  const VALID = ["user", "developer", "admin"] as const;
  if (!role || !VALID.includes(role as typeof VALID[number])) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ role: role as typeof VALID[number], updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id))
      .returning({ id: usersTable.id, role: usersTable.role });
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ success: true, role: updated.role });
  } catch (err) {
    req.log.error({ err }, "Failed to update user role");
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.get("/admin/export", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const [apps, submissions, reviews, logbook, feedback, users] = await Promise.all([
      db.select().from(appsTable),
      db.select().from(submissionsTable),
      db.select().from(reviewsTable),
      db.select().from(logbookTable),
      db.select().from(feedbackTable),
      db.select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        role: usersTable.role,
        authProvider: usersTable.authProvider,
        createdAt: usersTable.createdAt,
      }).from(usersTable),
    ]);
    // Include alias for pwaReadiness to avoid breaking frontends during migration
    const appsMapped = apps.map((a) => ({ ...a, pwaReadiness: (a as any).lighthouseScore ?? 0 }));
    const submissionsMapped = submissions.map((s) => ({ ...s, pwaReadiness: (s as any).lighthouseScore ?? 0 }));
    res.setHeader("Content-Disposition", `attachment; filename="appworld-export-${Date.now()}.json"`);
    res.json({ exportedAt: new Date().toISOString(), apps: appsMapped, submissions: submissionsMapped, reviews, logbook, feedback, users });
  } catch (err) {
    req.log.error({ err }, "Failed to export data");
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
