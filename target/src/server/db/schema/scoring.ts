import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const scoringModels = pgTable(
  "scoring_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    modelType: varchar("model_type", { length: 50 }).notNull(),
    config: jsonb("config").notNull().default({}),
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(false),
    trainedAt: timestamp("trained_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("scoring_models_workspace_idx").on(table.workspaceId),
    index("scoring_models_workspace_type_active_idx").on(
      table.workspaceId,
      table.modelType,
      table.isActive,
    ),
  ],
);

export type ScoringModel = typeof scoringModels.$inferSelect;
export type NewScoringModel = typeof scoringModels.$inferInsert;

export const scoreHistory = pgTable(
  "score_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => scoringModels.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 7, scale: 4 }).notNull(),
    label: varchar("label", { length: 20 }),
    features: jsonb("features"),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("score_history_entity_computed_idx").on(
      table.entityType,
      table.entityId,
      table.computedAt,
    ),
    index("score_history_workspace_idx").on(table.workspaceId),
  ],
);

export type ScoreHistory = typeof scoreHistory.$inferSelect;
export type NewScoreHistory = typeof scoreHistory.$inferInsert;
