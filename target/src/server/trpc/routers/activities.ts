import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { activities } from "@/server/db/schema/activities";
import {
  timelineSchema,
  createActivitySchema,
  uuidSchema,
} from "@/server/lib/validators";
import { writeAuditLog } from "@/server/lib/audit";

export const activitiesRouter = createRouter({
  timeline: protectedProcedure.input(timelineSchema).query(async ({ ctx, input }) => {
    const conditions = [
      eq(activities.workspaceId, ctx.workspaceId),
    ];

    if (input.contactId) {
      conditions.push(eq(activities.contactId, input.contactId));
    }
    if (input.companyId) {
      conditions.push(eq(activities.companyId, input.companyId));
    }
    if (input.dealId) {
      conditions.push(eq(activities.dealId, input.dealId));
    }
    if (input.activityType) {
      conditions.push(eq(activities.activityType, input.activityType));
    }

    const items = await ctx.db
      .select()
      .from(activities)
      .where(and(...conditions))
      .orderBy(desc(activities.occurredAt))
      .limit(input.limit + 1);

    const hasMore = items.length > input.limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }),

  create: protectedProcedure
    .input(createActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const [activity] = await ctx.db
        .insert(activities)
        .values({
          ...input,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
          workspaceId: ctx.workspaceId,
          ownerId: ctx.session.user.id,
        })
        .returning();

      await writeAuditLog({
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        action: "activity.created",
        entityType: "activity",
        entityId: activity!.id,
      });

      return activity!;
    }),

  getById: protectedProcedure
    .input(uuidSchema)
    .query(async ({ ctx, input }) => {
      const [activity] = await ctx.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, input),
            eq(activities.workspaceId, ctx.workspaceId),
          ),
        );

      return activity ?? null;
    }),
});
