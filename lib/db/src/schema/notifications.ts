import { pgTable, serial, text, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const notificationTypeEnum = pgEnum("notification_type", [
  "submission_update",
  "review_reply",
  "app_approved",
  "system",
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull().default("system"),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;
