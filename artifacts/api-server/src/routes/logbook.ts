import { Router } from "express";
import { db } from "@workspace/db";
import { logbookTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListLogbookEntriesQueryParams, CreateLogbookEntryBody } from "@workspace/api-zod";

const router = Router();

router.get("/logbook", async (req, res) => {
  const parsed = ListLogbookEntriesQueryParams.safeParse({
    appId: Number(req.query.appId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const entries = await db
    .select()
    .from(logbookTable)
    .where(eq(logbookTable.appId, parsed.data.appId))
    .orderBy(desc(logbookTable.createdAt));

  res.json(entries);
});

router.post("/logbook", async (req, res) => {
  const parsed = CreateLogbookEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [entry] = await db.insert(logbookTable).values(parsed.data).returning();
  res.status(201).json(entry);
});

export default router;
