import { eq, and, isNull } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { contacts } from "@/server/db/schema/contacts";
import { companies } from "@/server/db/schema/companies";
import { deals } from "@/server/db/schema/deals";

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(",");
}

export const exportRouter = createRouter({
  contactsCsv: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, ctx.workspaceId),
          isNull(contacts.deletedAt),
        ),
      );

    const header = "id,fullName,firstName,lastName,email,phone,jobTitle,city,countryCode,lifecycleStage,source";
    const lines = rows.map((r) =>
      toCsvRow([
        r.id,
        r.fullName,
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.jobTitle,
        r.city,
        r.countryCode,
        r.lifecycleStage,
        r.source,
      ]),
    );

    return {
      csv: [header, ...lines].join("\n"),
      filename: `contacts-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }),

  contactsVCard: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, ctx.workspaceId),
          isNull(contacts.deletedAt),
        ),
      );

    const vcards = rows.map((r) => {
      const lines: string[] = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${r.fullName}`,
      ];
      if (r.lastName || r.firstName) {
        lines.push(`N:${r.lastName ?? ""};${r.firstName ?? ""};;;`);
      }
      if (r.email) lines.push(`EMAIL:${r.email}`);
      if (r.phone) lines.push(`TEL:${r.phone}`);
      if (r.jobTitle) lines.push(`TITLE:${r.jobTitle}`);
      lines.push("END:VCARD");
      return lines.join("\r\n");
    });

    return {
      vcard: vcards.join("\r\n"),
      filename: `contacts-${new Date().toISOString().slice(0, 10)}.vcf`,
    };
  }),

  companiesCsv: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.workspaceId, ctx.workspaceId),
          isNull(companies.deletedAt),
        ),
      );

    const header = "id,name,domain,industry,employeeCount,annualRevenue,countryCode";
    const lines = rows.map((r) =>
      toCsvRow([
        r.id,
        r.name,
        r.domain,
        r.industry,
        r.employeeCount != null ? String(r.employeeCount) : null,
        r.annualRevenue != null ? String(r.annualRevenue) : null,
        r.countryCode,
      ]),
    );

    return {
      csv: [header, ...lines].join("\n"),
      filename: `companies-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }),

  dealsCsv: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.workspaceId, ctx.workspaceId),
          isNull(deals.deletedAt),
        ),
      );

    const header = "id,name,pipelineId,stageId,amount,currency,expectedCloseDate,actualCloseDate,source,priority";
    const lines = rows.map((r) =>
      toCsvRow([
        r.id,
        r.name,
        r.pipelineId,
        r.stageId,
        r.amount != null ? String(r.amount) : null,
        r.currency,
        r.expectedCloseDate,
        r.actualCloseDate,
        r.source,
        r.priority,
      ]),
    );

    return {
      csv: [header, ...lines].join("\n"),
      filename: `deals-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }),
});
