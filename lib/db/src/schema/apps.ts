import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appStatusEnum = pgEnum("app_status", ["pending", "approved", "rejected", "hidden"]);

export const appsTable = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  uvp: text("uvp"),
  url: text("url").notNull(),
  iconUrl: text("icon_url"),
  brandColor: text("brand_color"),
  category: text("category").notNull().default("Productivity"),
  lighthouseScore: integer("lighthouse_score").notNull().default(0),
  hasOfflineSupport: boolean("has_offline_support").notNull().default(false),
  hasPushNotifications: boolean("has_push_notifications").notNull().default(false),
  isInstallable: boolean("is_installable").notNull().default(false),
  views: integer("views").notNull().default(0),
  tryouts: integer("tryouts").notNull().default(0),
  installs: integer("installs").notNull().default(0),
  thumbsUp: integer("thumbs_up").notNull().default(0),
  thumbsDown: integer("thumbs_down").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBoosted: boolean("is_boosted").notNull().default(false),
  isVerifiedDev: boolean("is_verified_dev").notNull().default(false),
  status: appStatusEnum("status").notNull().default("approved"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppSchema = createInsertSchema(appsTable).omit({ id: true, createdAt: true });
export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof appsTable.$inferSelect;
