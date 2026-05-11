import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 1000 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // FK → contacts.id — defined without .references() to avoid circular imports
    contactId: uuid("contact_id"),
    // FK → companies.id — defined without .references() to avoid circular imports
    companyId: uuid("company_id"),
    // FK → deals.id — defined without .references() to avoid circular imports
    dealId: uuid("deal_id"),
    detail: jsonb("detail").notNull().default({}),
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activities_workspace_occurred_idx").on(
      table.workspaceId,
      table.occurredAt,
    ),
    index("activities_workspace_type_idx").on(
      table.workspaceId,
      table.activityType,
    ),
    index("activities_contact_occurred_idx").on(
      table.contactId,
      table.occurredAt,
    ),
    index("activities_deal_occurred_idx").on(table.dealId, table.occurredAt),
    index("activities_company_occurred_idx").on(
      table.companyId,
      table.occurredAt,
    ),
  ],
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
