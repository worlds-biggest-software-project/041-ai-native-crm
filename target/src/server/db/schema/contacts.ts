import {
  pgTable,
  uuid,
  varchar,
  char,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    // FK → companies.id (SET NULL) — defined without .references() to avoid circular imports
    companyId: uuid("company_id"),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    fullName: varchar("full_name", { length: 500 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    jobTitle: varchar("job_title", { length: 255 }),
    city: varchar("city", { length: 255 }),
    countryCode: char("country_code", { length: 2 }),
    lifecycleStage: varchar("lifecycle_stage", { length: 50 }).default("lead"),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 100 }),
    customFields: jsonb("custom_fields").notNull().default({}),
    leadScore: numeric("lead_score", { precision: 7, scale: 4 }),
    leadScoreLabel: varchar("lead_score_label", { length: 20 }),
    leadScoreUpdatedAt: timestamp("lead_score_updated_at", {
      withTimezone: true,
    }),
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
    index("contacts_workspace_idx").on(table.workspaceId),
    index("contacts_workspace_email_idx").on(table.workspaceId, table.email),
    index("contacts_company_idx").on(table.companyId),
    index("contacts_owner_idx").on(table.ownerId),
    index("contacts_workspace_lifecycle_idx").on(
      table.workspaceId,
      table.lifecycleStage,
    ),
    index("contacts_workspace_name_idx").on(
      table.workspaceId,
      table.lastName,
      table.firstName,
    ),
    index("contacts_workspace_lead_score_idx").on(
      table.workspaceId,
      table.leadScore,
    ),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
