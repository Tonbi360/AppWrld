import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListFeedbackQueryParams,
  SubmitFeedbackBody,
  UpdateFeedbackStatusParams,
  UpdateFeedbackStatusBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/feedback", async (req, res) => {
  const parsed = ListFeedbackQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const conditions = [];
  if (parsed.data.type) {
    conditions.push(eq(feedbackTable.type, parsed.data.type as "complaint" | "suggestion" | "bug" | "praise"));
  }
  if (parsed.data.status) {
    conditions.push(eq(feedbackTable.status, parsed.data.status as "open" | "reviewed" | "resolved"));
  }

  const items = await db
    .select()
    .from(feedbackTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(feedbackTable.createdAt));

  res.json(items);
});

router.post("/feedback", async (req, res) => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [item] = await db.insert(feedbackTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/admin/feedback/:id/status", async (req, res) => {
  const paramsParsed = UpdateFeedbackStatusParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateFeedbackStatusBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(feedbackTable)
    .set({ status: bodyParsed.data.status as "open" | "reviewed" | "resolved" })
    .where(eq(feedbackTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  res.json(updated);
});

export default router;
