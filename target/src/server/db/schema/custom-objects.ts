import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const customObjectDefinitions = pgTable(
  "custom_object_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    objectKey: varchar("object_key", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    displayNamePlural: varchar("display_name_plural", { length: 255 }),
    icon: varchar("icon", { length: 50 }),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("custom_obj_defs_workspace_key_idx").on(
      table.workspaceId,
      table.objectKey,
    ),
  ],
);

export type CustomObjectDefinition =
  typeof customObjectDefinitions.$inferSelect;
export type NewCustomObjectDefinition =
  typeof customObjectDefinitions.$inferInsert;

export const customObjectRecords = pgTable(
  "custom_object_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    objectDefId: uuid("def_id")
      .notNull()
      .references(() => customObjectDefinitions.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 500 }),
    fields: jsonb("fields").notNull().default({}),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("custom_obj_records_workspace_def_idx").on(
      table.workspaceId,
      table.objectDefId,
    ),
  ],
);

export type CustomObjectRecord = typeof customObjectRecords.$inferSelect;
export type NewCustomObjectRecord = typeof customObjectRecords.$inferInsert;
