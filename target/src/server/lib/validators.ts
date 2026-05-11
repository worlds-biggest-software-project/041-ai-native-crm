import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const cursorPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// T045: Contact validators
export const createContactSchema = z.object({
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  fullName: z.string().min(1).max(500),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  countryCode: z.string().length(2).optional(),
  lifecycleStage: z
    .enum(["lead", "subscriber", "opportunity", "customer", "evangelist", "other"])
    .default("lead"),
  companyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export const updateContactSchema = z.object({
  id: uuidSchema,
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  fullName: z.string().min(1).max(500).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  countryCode: z.string().length(2).optional(),
  lifecycleStage: z
    .enum(["lead", "subscriber", "opportunity", "customer", "evangelist", "other"])
    .optional(),
  companyId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  source: z.string().max(100).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const listContactsSchema = cursorPaginationSchema.extend({
  search: z.string().max(500).optional(),
  lifecycleStage: z
    .enum(["lead", "subscriber", "opportunity", "customer", "evangelist", "other"])
    .optional(),
  ownerId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  sortBy: z
    .enum(["fullName", "email", "createdAt", "updatedAt", "lastActivityAt", "leadScore"])
    .default("createdAt"),
  sortOrder: sortOrderSchema,
});

// T046: Company validators
export const createCompanySchema = z.object({
  name: z.string().min(1).max(500),
  domain: z.string().max(255).optional(),
  industry: z.string().max(255).optional(),
  employeeCount: z.number().int().nonnegative().optional(),
  annualRevenue: z.number().int().nonnegative().optional(),
  revenueCurrency: z.string().length(3).default("USD"),
  countryCode: z.string().length(2).optional(),
  ownerId: z.string().uuid().optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export const updateCompanySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(500).optional(),
  domain: z.string().max(255).optional(),
  industry: z.string().max(255).optional(),
  employeeCount: z.number().int().nonnegative().nullable().optional(),
  annualRevenue: z.number().int().nonnegative().nullable().optional(),
  revenueCurrency: z.string().length(3).optional(),
  countryCode: z.string().length(2).nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const listCompaniesSchema = cursorPaginationSchema.extend({
  search: z.string().max(500).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "lastActivityAt"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

// T047: Deal validators
export const pipelineStageSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  order: z.number().int().nonnegative(),
  probability: z.number().int().min(0).max(100),
  type: z.enum(["open", "won", "lost"]),
});

export const createDealSchema = z.object({
  name: z.string().min(1).max(500),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  expectedCloseDate: z.string().date().optional(),
  ownerId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  contactIds: z.array(z.string().uuid()).default([]),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export const updateDealSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(500).optional(),
  stageId: z.string().uuid().optional(),
  companyId: z.string().uuid().nullable().optional(),
  amount: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
  expectedCloseDate: z.string().date().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  source: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const listDealsSchema = cursorPaginationSchema.extend({
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z
    .enum(["name", "amount", "createdAt", "updatedAt", "expectedCloseDate", "healthScore"])
    .default("createdAt"),
  sortOrder: sortOrderSchema,
});
