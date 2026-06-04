import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTypeEnum = pgEnum("feedback_type", ["complaint", "suggestion", "bug", "praise"]);
export const feedbackStatusEnum = pgEnum("feedback_status", ["open", "reviewed", "resolved"]);
export const senderTypeEnum = pgEnum("sender_type", ["user", "developer"]);

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: feedbackTypeEnum("type").notNull(),
  message: text("message").notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  senderName: text("sender_name"),
  contactEmail: text("contact_email"),
  status: feedbackStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
