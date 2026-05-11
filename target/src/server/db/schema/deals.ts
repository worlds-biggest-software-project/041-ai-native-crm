import {
  pgTable,
  uuid,
  varchar,
  bigint,
  date,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { pipelines } from "./pipelines";
import { users } from "./users";

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "restrict" }),
    stageId: uuid("stage_id").notNull(),
    // FK → companies.id — defined without .references() to avoid circular imports
    companyId: uuid("company_id"),
    name: varchar("name", { length: 500 }).notNull(),
    amount: bigint("amount", { mode: "number" }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    expectedCloseDate: date("expected_close_date"),
    actualCloseDate: date("actual_close_date"),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 100 }),
    priority: varchar("priority", { length: 20 }).default("medium"),
    customFields: jsonb("custom_fields").notNull().default({}),
    healthScore: numeric("health_score", { precision: 7, scale: 4 }),
    healthLabel: varchar("health_label", { length: 20 }),
    healthScoreUpdatedAt: timestamp("health_score_updated_at", {
      withTimezone: true,
    }),
    contactIds: uuid("contact_ids")
      .array()
      .default(sql`'{}'::uuid[]`),
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    emailCount: integer("email_count").default(0),
    meetingCount: integer("meeting_count").default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deals_workspace_idx").on(table.workspaceId),
    index("deals_pipeline_idx").on(table.pipelineId),
    index("deals_stage_idx").on(table.stageId),
    index("deals_company_idx").on(table.companyId),
    index("deals_owner_idx").on(table.ownerId),
    index("deals_workspace_close_date_idx").on(
      table.workspaceId,
      table.expectedCloseDate,
    ),
    index("deals_workspace_health_score_idx").on(
      table.workspaceId,
      table.healthScore,
    ),
  ],
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
