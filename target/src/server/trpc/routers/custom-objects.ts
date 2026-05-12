import { z } from "zod";
import { eq, and, isNull, asc, gt } from "drizzle-orm";
import { protectedProcedure, adminProcedure, createRouter } from "../init";
import {
  customObjectDefinitions,
  customObjectRecords,
} from "@/server/db/schema/custom-objects";
import { fieldDefinitions } from "@/server/db/schema/field-definitions";
import {
  validateCustomFields,
  type FieldDefinitionForValidation,
} from "@/server/lib/validators";
import { TRPCError } from "@trpc/server";

export const customObjectsRouter = createRouter({
  listDefinitions: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(customObjectDefinitions)
      .where(eq(customObjectDefinitions.workspaceId, ctx.workspaceId))
      .orderBy(asc(customObjectDefinitions.displayName));
  }),

  createDefinition: adminProcedure
    .input(
      z.object({
        objectKey: z.string().min(1).max(100),
        displayName: z.string().min(1).max(255),
        displayNamePlural: z.string().max(255).optional(),
        icon: z.string().max(50).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(customObjectDefinitions)
        .values({
          workspaceId: ctx.workspaceId,
          objectKey: input.objectKey,
          displayName: input.displayName,
          displayNamePlural: input.displayNamePlural,
          icon: input.icon,
          description: input.description,
        })
        .returning();

      return created!;
    }),

  deleteDefinition: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(customObjectDefinitions)
        .where(
          and(
            eq(customObjectDefinitions.id, input.id),
            eq(customObjectDefinitions.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return { success: !!deleted };
    }),

  listRecords: protectedProcedure
    .input(
      z.object({
        objectDefId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(customObjectRecords.workspaceId, ctx.workspaceId),
        eq(customObjectRecords.objectDefId, input.objectDefId),
        isNull(customObjectRecords.deletedAt),
      ];

      if (input.cursor) {
        conditions.push(gt(customObjectRecords.id, input.cursor));
      }

      const items = await ctx.db
        .select()
        .from(customObjectRecords)
        .where(and(...conditions))
        .orderBy(asc(customObjectRecords.id))
        .limit(input.limit + 1);

      const hasMore = items.length > input.limit;
      if (hasMore) items.pop();

      return {
        items,
        nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      };
    }),

  createRecord: protectedProcedure
    .input(
      z.object({
        objectDefId: z.string().uuid(),
        displayName: z.string().max(500).optional(),
        fields: z.record(z.string(), z.unknown()),
        ownerId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch field definitions for this object type to validate fields
      const defs = await ctx.db
        .select()
        .from(fieldDefinitions)
        .where(
          and(
            eq(fieldDefinitions.workspaceId, ctx.workspaceId),
            eq(fieldDefinitions.entityType, input.objectDefId),
          ),
        );

      const defsForValidation: FieldDefinitionForValidation[] = defs.map(
        (d) => ({
          fieldKey: d.fieldKey,
          fieldType: d.fieldType,
          isRequired: d.isRequired,
          options: d.options as { value: string; label: string }[] | null,
        }),
      );

      if (defsForValidation.length > 0) {
        const result = validateCustomFields(input.fields, defsForValidation);
        if (!result.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Field validation failed: ${result.errors.join("; ")}`,
          });
        }
      }

      const [created] = await ctx.db
        .insert(customObjectRecords)
        .values({
          workspaceId: ctx.workspaceId,
          objectDefId: input.objectDefId,
          displayName: input.displayName,
          fields: input.fields,
          ownerId: input.ownerId,
        })
        .returning();

      return created!;
    }),

  updateRecord: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        displayName: z.string().max(500).optional(),
        fields: z.record(z.string(), z.unknown()).optional(),
        ownerId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // If fields are being updated, validate them
      if (data.fields) {
        const [existing] = await ctx.db
          .select()
          .from(customObjectRecords)
          .where(
            and(
              eq(customObjectRecords.id, id),
              eq(customObjectRecords.workspaceId, ctx.workspaceId),
              isNull(customObjectRecords.deletedAt),
            ),
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Record not found",
          });
        }

        const defs = await ctx.db
          .select()
          .from(fieldDefinitions)
          .where(
            and(
              eq(fieldDefinitions.workspaceId, ctx.workspaceId),
              eq(fieldDefinitions.entityType, existing.objectDefId),
            ),
          );

        const defsForValidation: FieldDefinitionForValidation[] = defs.map(
          (d) => ({
            fieldKey: d.fieldKey,
            fieldType: d.fieldType,
            isRequired: d.isRequired,
            options: d.options as { value: string; label: string }[] | null,
          }),
        );

        if (defsForValidation.length > 0) {
          const result = validateCustomFields(data.fields, defsForValidation);
          if (!result.valid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Field validation failed: ${result.errors.join("; ")}`,
            });
          }
        }
      }

      const [updated] = await ctx.db
        .update(customObjectRecords)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(customObjectRecords.id, id),
            eq(customObjectRecords.workspaceId, ctx.workspaceId),
            isNull(customObjectRecords.deletedAt),
          ),
        )
        .returning();

      return updated ?? null;
    }),

  deleteRecord: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(customObjectRecords)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(customObjectRecords.id, input.id),
            eq(customObjectRecords.workspaceId, ctx.workspaceId),
            isNull(customObjectRecords.deletedAt),
          ),
        )
        .returning();

      return { success: !!deleted };
    }),
});
