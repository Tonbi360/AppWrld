import { Router } from "express";
import { db } from "@workspace/db";
import { submissionsTable, appsTable, feedbackTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ApproveSubmissionParams,
  RejectSubmissionParams,
  RejectSubmissionBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/admin/queue", async (_req, res) => {
  const queue = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.status, "pending"))
    .orderBy(desc(submissionsTable.createdAt));

  res.json(queue);
});

router.post("/admin/submissions/:id/approve", async (req, res) => {
  const parsed = ApproveSubmissionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

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

  res.json({ success: true, message: "Submission approved and app is now live." });
});

router.post("/admin/submissions/:id/reject", async (req, res) => {
  const paramsParsed = RejectSubmissionParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = RejectSubmissionBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(submissionsTable)
    .set({ status: "rejected", rejectionReason: bodyParsed.data.reason })
    .where(eq(submissionsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.json({ success: true, message: "Submission rejected." });
});

router.get("/admin/stats", async (_req, res) => {
  const [[pendingRow], [totalRow], [feedbackRow], [weekRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(submissionsTable).where(eq(submissionsTable.status, "pending")),
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
});

export default router;
