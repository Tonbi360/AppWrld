import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, appsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListReviewsQueryParams,
  CreateReviewBody,
  ReplyToReviewParams,
  ReplyToReviewBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/reviews", async (req, res) => {
  const parsed = ListReviewsQueryParams.safeParse({
    appId: Number(req.query.appId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.appId, parsed.data.appId))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews);
});

router.post("/reviews", async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { vote, appId } = parsed.data;
  const thumbCol = vote === "up" ? appsTable.thumbsUp : appsTable.thumbsDown;

  const [review] = await db.insert(reviewsTable).values(parsed.data).returning();
  // increment thumb count on app
  await db
    .update(appsTable)
    .set({ [thumbCol.name]: db.$with("ignored").as(db.select()) } as never)
    .where(eq(appsTable.id, appId))
    .catch(() => null);

  res.status(201).json(review);
});

router.post("/reviews/:id/reply", async (req, res) => {
  const paramsParsed = ReplyToReviewParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = ReplyToReviewBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ developerReply: bodyParsed.data.reply })
    .where(eq(reviewsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json(updated);
});

export default router;
