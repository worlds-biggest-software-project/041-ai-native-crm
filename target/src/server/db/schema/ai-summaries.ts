import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { activities } from "./activities";

export const aiSummaries = pgTable(
  "ai_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    summaryType: varchar("summary_type", { length: 50 }).notNull(),
    content: jsonb("content").notNull(),
    modelId: varchar("model_id", { length: 100 }).notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_summaries_workspace_idx").on(table.workspaceId),
    index("ai_summaries_activity_idx").on(table.activityId),
  ],
);

export type AiSummary = typeof aiSummaries.$inferSelect;
export type NewAiSummary = typeof aiSummaries.$inferInsert;
