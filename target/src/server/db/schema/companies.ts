import {
  pgTable,
  uuid,
  varchar,
  char,
  integer,
  bigint,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 500 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    industry: varchar("industry", { length: 255 }),
    employeeCount: integer("employee_count"),
    annualRevenue: bigint("annual_revenue", { mode: "number" }),
    revenueCurrency: varchar("revenue_currency", { length: 3 }).default("USD"),
    countryCode: char("country_code", { length: 2 }),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customFields: jsonb("custom_fields").notNull().default({}),
    contactCount: integer("contact_count").default(0),
    openDealCount: integer("open_deal_count").default(0),
    totalDealValue: bigint("total_deal_value", { mode: "number" }).default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("companies_workspace_idx").on(table.workspaceId),
    index("companies_workspace_domain_idx").on(
      table.workspaceId,
      table.domain,
    ),
    index("companies_workspace_name_idx").on(table.workspaceId, table.name),
  ],
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
