import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, adminProcedure, createRouter } from "../init";
import { workspaces } from "@/server/db/schema/workspaces";
import { users } from "@/server/db/schema/users";

export const settingsRouter = createRouter({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const [workspace] = await ctx.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, ctx.workspaceId));

    return workspace ?? null;
  }),

  updateWorkspace: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(100).optional(),
        plan: z.string().min(1).max(50).optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(workspaces)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, ctx.workspaceId))
        .returning();

      return updated;
    }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(users)
      .where(eq(users.workspaceId, ctx.workspaceId));
  }),

  inviteUser: adminProcedure
    .input(
      z.object({
        email: z.string().email().max(320),
        fullName: z.string().min(1).max(255),
        role: z.string().min(1).max(50).default("member"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(users)
        .values({
          workspaceId: ctx.workspaceId,
          email: input.email,
          fullName: input.fullName,
          role: input.role,
        })
        .returning();

      return created;
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(
          and(eq(users.id, input.userId), eq(users.workspaceId, ctx.workspaceId)),
        )
        .returning();

      return updated;
    }),

  deactivateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(eq(users.id, input.userId), eq(users.workspaceId, ctx.workspaceId)),
        )
        .returning();

      return updated;
    }),
});
