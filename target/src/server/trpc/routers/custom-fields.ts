import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { adminProcedure, createRouter } from "../init";
import { fieldDefinitions } from "@/server/db/schema/field-definitions";

// TODO: Wire validateCustomFields into create/update mutations

export const customFieldsRouter = createRouter({
  list: adminProcedure
    .input(
      z.object({
        entityType: z.string().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.workspaceId, ctx.workspaceId),
            eq(fieldDefinitions.entityType, input.entityType),
          ),
        )
        .orderBy(asc(fieldDefinitions.displayOrder));
    }),

  create: adminProcedure
    .input(
      z.object({
        entityType: z.string().min(1).max(50),
        fieldKey: z.string().min(1).max(100),
        displayName: z.string().min(1).max(255),
        fieldType: z.string().min(1).max(50),
        description: z.string().optional(),
        isRequired: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        defaultValue: z.unknown().optional(),
        validation: z.record(z.string(), z.unknown()).optional(),
        options: z
          .array(z.object({ value: z.string(), label: z.string() }))
          .optional(),
        displayOrder: z.number().int().optional(),
        groupName: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(fieldDefinitions)
        .values({
          workspaceId: ctx.workspaceId,
          entityType: input.entityType,
          fieldKey: input.fieldKey,
          displayName: input.displayName,
          fieldType: input.fieldType,
          description: input.description,
          isRequired: input.isRequired ?? false,
          isUnique: input.isUnique ?? false,
          defaultValue: input.defaultValue ?? null,
          validation: input.validation ?? null,
          options: input.options ?? null,
          displayOrder: input.displayOrder ?? 0,
          groupName: input.groupName,
        })
        .returning();

      return created!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        displayName: z.string().min(1).max(255).optional(),
        fieldType: z.string().min(1).max(50).optional(),
        description: z.string().optional(),
        isRequired: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        defaultValue: z.unknown().optional(),
        validation: z.record(z.string(), z.unknown()).optional(),
        options: z
          .array(z.object({ value: z.string(), label: z.string() }))
          .optional(),
        displayOrder: z.number().int().optional(),
        groupName: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(fieldDefinitions)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(fieldDefinitions.id, id),
            eq(fieldDefinitions.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return updated ?? null;
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only delete if not a system field
      const [existing] = await ctx.db
        .select()
        .from(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.id, input.id),
            eq(fieldDefinitions.workspaceId, ctx.workspaceId),
          ),
        );

      if (!existing) {
        return { success: false };
      }

      if (existing.isSystem) {
        return { success: false };
      }

      await ctx.db
        .delete(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.id, input.id),
            eq(fieldDefinitions.workspaceId, ctx.workspaceId),
          ),
        );

      return { success: true };
    }),

  reorder: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            displayOrder: z.number().int(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input.items) {
        await ctx.db
          .update(fieldDefinitions)
          .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
          .where(
            and(
              eq(fieldDefinitions.id, item.id),
              eq(fieldDefinitions.workspaceId, ctx.workspaceId),
            ),
          );
      }

      return { success: true };
    }),
});
