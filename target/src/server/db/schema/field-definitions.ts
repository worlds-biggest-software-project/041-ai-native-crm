import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const fieldDefinitions = pgTable(
  "field_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    fieldType: varchar("field_type", { length: 50 }).notNull(),
    description: text("description"),
    isRequired: boolean("is_required").notNull().default(false),
    isUnique: boolean("is_unique").notNull().default(false),
    defaultValue: jsonb("default_value"),
    validation: jsonb("validation"),
    options: jsonb("options"),
    displayOrder: integer("display_order").notNull().default(0),
    groupName: varchar("group_name", { length: 100 }),
    isSystem: boolean("is_system").notNull().default(false),
    gdprCategory: varchar("gdpr_category", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("field_defs_workspace_entity_key_idx").on(
      table.workspaceId,
      table.entityType,
      table.fieldKey,
    ),
    index("field_defs_workspace_entity_idx").on(
      table.workspaceId,
      table.entityType,
    ),
  ],
);

export type FieldDefinition = typeof fieldDefinitions.$inferSelect;
export type NewFieldDefinition = typeof fieldDefinitions.$inferInsert;
