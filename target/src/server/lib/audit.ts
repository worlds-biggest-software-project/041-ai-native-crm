import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema/audit-log";

interface AuditLogEntry {
  workspaceId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  await db.insert(auditLogs).values({
    workspaceId: entry.workspaceId,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    changes: entry.changes ?? null,
    ipAddress: entry.ipAddress ?? null,
  });
}
