"use server";

import { eq, and, desc, count, inArray } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { alerts, transactions, rules, tenantUsers, auditLogs } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { withRetry } from "@/lib/utils/retry";
import {
  AppDatabaseError,
  VERSION_CONFLICT_CODE,
  getErrorCode,
} from "@/lib/utils/db-errors";
import { DEMO_ADMIN_ID } from "@/types";
import {
  DEMO_ALERT_ROWS,
  DEMO_ALERT_COUNTS,
} from "@/lib/demo/data";
import type { AlertStatus } from "@/types";

export async function listAlerts(statusFilter?: string) {
  if (!isDbConfigured()) {
    return { rows: DEMO_ALERT_ROWS, counts: DEMO_ALERT_COUNTS };
  }
  const db = await getDb();
  const tenantId = await getTenantId();

  const conditions = [eq(alerts.tenantId, tenantId)];
  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(alerts.status, statusFilter));
  }

  const rows = await db
    .select({
      id: alerts.id,
      title: alerts.title,
      severity: alerts.severity,
      status: alerts.status,
      createdAt: alerts.createdAt,
      assignedTo: alerts.assignedTo,
      ruleName: rules.name,
      amount: transactions.amount,
      currency: transactions.currency,
      senderCountry: transactions.senderCountry,
      receiverCountry: transactions.receiverCountry,
    })
    .from(alerts)
    .innerJoin(transactions, eq(alerts.transactionId, transactions.id))
    .innerJoin(rules, eq(alerts.ruleId, rules.id))
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt))
    .limit(100);

  const statusCounts = await db
    .select({ status: alerts.status, count: count() })
    .from(alerts)
    .where(eq(alerts.tenantId, tenantId))
    .groupBy(alerts.status);

  const counts: Record<string, number> = { all: 0 };
  for (const s of statusCounts) {
    counts[s.status] = s.count;
    counts.all += s.count;
  }

  if (rows.length === 0) {
    return { rows: DEMO_ALERT_ROWS, counts: DEMO_ALERT_COUNTS };
  }

  return { rows, counts };
}

export async function getAlertById(id: string) {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  const tenantId = await getTenantId();

  const [alert] = await db
    .select({
      alert: alerts,
      transaction: transactions,
      rule: rules,
    })
    .from(alerts)
    .innerJoin(transactions, eq(alerts.transactionId, transactions.id))
    .innerJoin(rules, eq(alerts.ruleId, rules.id))
    .where(and(eq(alerts.id, id), eq(alerts.tenantId, tenantId)))
    .limit(1);

  if (!alert) return null;

  const similar = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.senderName, alert.transaction.senderName)
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(5);

  const timeline = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "alert"),
        eq(auditLogs.entityId, id)
      )
    )
    .orderBy(desc(auditLogs.createdAt));

  const users = await db
    .select()
    .from(tenantUsers)
    .where(eq(tenantUsers.tenantId, tenantId));

  return { ...alert, similar, timeline, users };
}

export async function updateAlertStatus(
  alertId: string,
  newStatus: AlertStatus,
  currentVersion: number,
  assignedTo?: string | null,
  actorName: string = "Aritra Sen"
): Promise<{
  success: boolean;
  alert?: (typeof alerts.$inferSelect);
  error?: string;
  code?: string;
}> {
  if (!isDbConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  const db = await getDb();
  const tenantId = await getTenantId();

  try {
    const result = await withRetry(async () =>
      db.transaction(async (tx) => {
        const updated = await tx
          .update(alerts)
          .set({
            status: newStatus,
            version: currentVersion + 1,
            assignedTo: assignedTo ?? undefined,
            resolvedAt:
              newStatus === "resolved" || newStatus === "false_positive"
                ? new Date()
                : null,
          })
          .where(
            and(
              eq(alerts.id, alertId),
              eq(alerts.version, currentVersion),
              eq(alerts.tenantId, tenantId)
            )
          )
          .returning();

        if (updated.length === 0) {
          throw new AppDatabaseError(
            "Concurrent modification detected. The alert was updated by another user.",
            VERSION_CONFLICT_CODE
          );
        }

        await tx.insert(auditLogs).values({
          tenantId,
          actorId: DEMO_ADMIN_ID,
          actorName,
          action: "status_changed",
          entityType: "alert",
          entityId: alertId,
          detailsText: `Status changed to ${newStatus}`,
        });

        return updated[0];
      })
    );

    return { success: true, alert: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Update failed",
      code: getErrorCode(err),
    };
  }
}

export async function getAlertStatusCounts() {
  if (!isDbConfigured()) return {};
  const db = await getDb();
  const tenantId = await getTenantId();

  const rows = await db
    .select({ status: alerts.status, count: count() })
    .from(alerts)
    .where(eq(alerts.tenantId, tenantId))
    .groupBy(alerts.status);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r.count;
  return counts;
}
