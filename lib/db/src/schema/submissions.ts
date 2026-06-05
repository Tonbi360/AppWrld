import { pgTable, serial, text, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const SUBMISSION_STATUSES = [
  "received",
  "under_review",
  "needs_info",
  "confirmed",
  "in_progress",
  "fixed",
  "released",
  "rejected",
  "duplicate",
] as const;

export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];

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
  status: text("status").notNull().default("received"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  submitterId: varchar("submitter_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    status: z.enum(SUBMISSION_STATUSES).optional(),
  });

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
