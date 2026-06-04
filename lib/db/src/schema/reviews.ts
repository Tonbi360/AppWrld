import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appsTable } from "./apps";

export const voteEnum = pgEnum("vote_type", ["up", "down"]);

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull().references(() => appsTable.id, { onDelete: "cascade" }),
  vote: voteEnum("vote").notNull(),
  comment: text("comment").notNull(),
  isBugReport: boolean("is_bug_report").notNull().default(false),
  ghostName: text("ghost_name").notNull(),
  developerReply: text("developer_reply"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
