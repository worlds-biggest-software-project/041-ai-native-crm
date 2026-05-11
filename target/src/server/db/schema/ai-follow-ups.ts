import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { activities } from "./activities";
import { contacts } from "./contacts";

export const aiFollowUps = pgTable(
  "ai_follow_ups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id").references(() => activities.id, {
      onDelete: "set null",
    }),
    // FK → deals.id — defined without .references() to avoid circular imports
    dealId: uuid("deal_id"),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 1000 }),
    bodyText: text("body_text").notNull(),
    bodyHtml: text("body_html"),
    status: varchar("status", { length: 20 }).default("draft"),
    modelId: varchar("model_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentBy: uuid("sent_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("ai_follow_ups_workspace_idx").on(table.workspaceId),
    index("ai_follow_ups_activity_idx").on(table.activityId),
    index("ai_follow_ups_contact_idx").on(table.contactId),
  ],
);

export type AiFollowUp = typeof aiFollowUps.$inferSelect;
export type NewAiFollowUp = typeof aiFollowUps.$inferInsert;
