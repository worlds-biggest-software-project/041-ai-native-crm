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

// T110: Activity Timeline validators
export const timelineSchema = z.object({
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  activityType: z.string().max(50).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export const createActivitySchema = z.object({
  activityType: z.string().min(1).max(50),
  subject: z.string().max(1000).optional(),
  occurredAt: z.string().datetime().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  detail: z.record(z.string(), z.unknown()).optional(),
});

// T113: Global Search validators
export const globalSearchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
});

// T191: Custom field validation
export interface FieldDefinitionForValidation {
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  options?: { value: string; label: string }[] | null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomFields(
  fields: Record<string, unknown>,
  definitions: FieldDefinitionForValidation[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const definedKeys = new Set(definitions.map((d) => d.fieldKey));

  // Reject unknown keys
  for (const key of Object.keys(fields)) {
    if (!definedKeys.has(key)) {
      errors.push(`Unknown field key: "${key}"`);
    }
  }

  // Validate each definition
  for (const def of definitions) {
    const value = fields[def.fieldKey];

    // Check required
    if (def.isRequired && (value === undefined || value === null || value === "")) {
      errors.push(`Missing required field: "${def.fieldKey}"`);
      continue;
    }

    // Skip type check if value is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type checks
    switch (def.fieldType) {
      case "text": {
        if (typeof value !== "string") {
          errors.push(`Field "${def.fieldKey}" must be a string`);
        }
        break;
      }
      case "number":
      case "currency": {
        if (typeof value !== "number") {
          errors.push(`Field "${def.fieldKey}" must be a number`);
        }
        break;
      }
      case "date": {
        if (typeof value !== "string" || !ISO_DATE_RE.test(value)) {
          errors.push(`Field "${def.fieldKey}" must be a date string in ISO format (YYYY-MM-DD)`);
        }
        break;
      }
      case "datetime": {
        if (typeof value !== "string" || !ISO_DATETIME_RE.test(value)) {
          errors.push(`Field "${def.fieldKey}" must be a datetime string in ISO format`);
        }
        break;
      }
      case "email": {
        if (typeof value !== "string" || !EMAIL_RE.test(value)) {
          errors.push(`Field "${def.fieldKey}" must be a valid email address`);
        }
        break;
      }
      case "checkbox": {
        if (typeof value !== "boolean") {
          errors.push(`Field "${def.fieldKey}" must be a boolean`);
        }
        break;
      }
      case "select": {
        if (typeof value !== "string") {
          errors.push(`Field "${def.fieldKey}" must be a string`);
        } else if (def.options) {
          const allowed = new Set(def.options.map((o) => o.value));
          if (!allowed.has(value)) {
            errors.push(`Field "${def.fieldKey}" has invalid option: "${value}"`);
          }
        }
        break;
      }
      case "multi_select": {
        if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
          errors.push(`Field "${def.fieldKey}" must be an array of strings`);
        } else if (def.options) {
          const allowed = new Set(def.options.map((o) => o.value));
          for (const v of value) {
            if (!allowed.has(v as string)) {
              errors.push(`Field "${def.fieldKey}" has invalid option: "${v}"`);
            }
          }
        }
        break;
      }
      default:
        // Accept any value for unknown field types
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}
