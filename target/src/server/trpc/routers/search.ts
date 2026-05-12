import { eq, and, ilike, isNull, or } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { contacts } from "@/server/db/schema/contacts";
import { companies } from "@/server/db/schema/companies";
import { deals } from "@/server/db/schema/deals";
import { globalSearchSchema } from "@/server/lib/validators";

export const searchRouter = createRouter({
  global: protectedProcedure
    .input(globalSearchSchema)
    .query(async ({ ctx, input }) => {
      const pattern = `%${input.query}%`;

      const [matchedContacts, matchedCompanies, matchedDeals] =
        await Promise.all([
          ctx.db
            .select({
              id: contacts.id,
              fullName: contacts.fullName,
              email: contacts.email,
            })
            .from(contacts)
            .where(
              and(
                eq(contacts.workspaceId, ctx.workspaceId),
                isNull(contacts.deletedAt),
                or(
                  ilike(contacts.fullName, pattern),
                  ilike(contacts.email, pattern),
                ),
              ),
            )
            .limit(input.limit),

          ctx.db
            .select({
              id: companies.id,
              name: companies.name,
              domain: companies.domain,
            })
            .from(companies)
            .where(
              and(
                eq(companies.workspaceId, ctx.workspaceId),
                isNull(companies.deletedAt),
                ilike(companies.name, pattern),
              ),
            )
            .limit(input.limit),

          ctx.db
            .select({
              id: deals.id,
              name: deals.name,
              amount: deals.amount,
            })
            .from(deals)
            .where(
              and(
                eq(deals.workspaceId, ctx.workspaceId),
                isNull(deals.deletedAt),
                ilike(deals.name, pattern),
              ),
            )
            .limit(input.limit),
        ]);

      return {
        contacts: matchedContacts.map((c) => ({
          id: c.id,
          type: "contact" as const,
          title: c.fullName,
          subtitle: c.email ?? null,
        })),
        companies: matchedCompanies.map((c) => ({
          id: c.id,
          type: "company" as const,
          title: c.name,
          subtitle: c.domain ?? null,
        })),
        deals: matchedDeals.map((d) => ({
          id: d.id,
          type: "deal" as const,
          title: d.name,
          subtitle: d.amount != null ? `${d.amount}` : null,
        })),
      };
    }),
});
