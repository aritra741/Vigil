"use server";

import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";

export async function listAuditLogs(filters: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  actorName?: string;
} = {}) {
  if (!isDbConfigured()) return { rows: [], total: 0 };
  const db = await getDb();
  const tenantId = await getTenantId();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(auditLogs.tenantId, tenantId)];
  if (filters.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters.actorName) {
    conditions.push(eq(auditLogs.actorName, filters.actorName));
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { rows, total: totalResult?.count ?? 0 };
}

export async function logAuditEntry(data: {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  detailsText?: string;
}) {
  if (!isDbConfigured()) return;
  const db = await getDb();
  const tenantId = await getTenantId();

  await db.insert(auditLogs).values({
    tenantId,
    ...data,
  });
}
