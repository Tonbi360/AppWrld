import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  uvp: text("uvp").notNull(),
  iconUrl: text("icon_url"),
  brandColor: text("brand_color"),
  category: text("category").notNull().default("Productivity"),
  lighthouseScore: integer("lighthouse_score").notNull().default(0),
  hasManifest: boolean("has_manifest").notNull().default(false),
  status: submissionStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
