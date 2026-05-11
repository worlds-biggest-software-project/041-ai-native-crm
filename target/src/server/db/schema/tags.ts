import {
  pgTable,
  uuid,
  varchar,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 7 }),
  },
  (table) => [
    uniqueIndex("tags_workspace_name_idx").on(table.workspaceId, table.name),
  ],
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const entityTags = pgTable(
  "entity_tags",
  {
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.entityType, table.entityId] }),
    index("entity_tags_entity_idx").on(table.entityType, table.entityId),
  ],
);

export type EntityTag = typeof entityTags.$inferSelect;
export type NewEntityTag = typeof entityTags.$inferInsert;
