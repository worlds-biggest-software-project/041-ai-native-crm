import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const enrichmentSources = pgTable(
  "enrichment_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    sourceType: varchar("source_type", { length: 50 }).notNull(),
    config: jsonb("config").notNull().default({}),
    gdprBasis: varchar("gdpr_basis", { length: 100 }),
    liaDocumentUrl: text("lia_document_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("enrichment_sources_workspace_idx").on(table.workspaceId)],
);

export type EnrichmentSource = typeof enrichmentSources.$inferSelect;
export type NewEnrichmentSource = typeof enrichmentSources.$inferInsert;

export const enrichmentLogs = pgTable(
  "enrichment_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => enrichmentSources.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    changes: jsonb("changes").notNull(),
    sourceUrl: text("source_url"),
    status: varchar("status", { length: 20 }).default("pending"),
    enrichedAt: timestamp("enriched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("enrichment_logs_entity_idx").on(table.entityType, table.entityId),
    index("enrichment_logs_workspace_idx").on(table.workspaceId),
  ],
);

export type EnrichmentLog = typeof enrichmentLogs.$inferSelect;
export type NewEnrichmentLog = typeof enrichmentLogs.$inferInsert;
