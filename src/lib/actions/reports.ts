"use server";

import { eq, and, count, gte, lte, inArray, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { reports, transactions, alerts, auditLogs, rules } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { DEMO_ADMIN_ID } from "@/types";
import { format } from "date-fns";

export async function listReports() {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const tenantId = await getTenantId();

  return db
    .select()
    .from(reports)
    .where(eq(reports.tenantId, tenantId))
    .orderBy(desc(reports.createdAt))
    .limit(20);
}

export async function generateReport(data: {
  dateRangeStart: Date;
  dateRangeEnd: Date;
  title?: string;
}) {
  if (!isDbConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  const db = await getDb();
  const tenantId = await getTenantId();

  const [txCount] = await db
    .select({ count: count() })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        gte(transactions.createdAt, data.dateRangeStart),
        lte(transactions.createdAt, data.dateRangeEnd)
      )
    );

  const [flaggedCount] = await db
    .select({ count: count() })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        gte(transactions.createdAt, data.dateRangeStart),
        lte(transactions.createdAt, data.dateRangeEnd),
        inArray(transactions.status, ["flagged", "blocked"])
      )
    );

  const [resolvedCount] = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        gte(alerts.createdAt, data.dateRangeStart),
        lte(alerts.createdAt, data.dateRangeEnd),
        eq(alerts.status, "resolved")
      )
    );

  const severityBreakdown = await db
    .select({ severity: alerts.severity, count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        gte(alerts.createdAt, data.dateRangeStart),
        lte(alerts.createdAt, data.dateRangeEnd)
      )
    )
    .groupBy(alerts.severity);

  const topRules = await db
    .select({ name: rules.name, count: count() })
    .from(alerts)
    .innerJoin(rules, eq(alerts.ruleId, rules.id))
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        gte(alerts.createdAt, data.dateRangeStart),
        lte(alerts.createdAt, data.dateRangeEnd)
      )
    )
    .groupBy(rules.name)
    .orderBy(desc(count()))
    .limit(5);

  const recentAudit = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        gte(auditLogs.createdAt, data.dateRangeStart),
        lte(auditLogs.createdAt, data.dateRangeEnd)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  const title =
    data.title ??
    `Risk Review Report — ${format(data.dateRangeStart, "MMMM yyyy")}`;

  const summaryLines = [
    `Total transactions monitored: ${txCount?.count ?? 0}`,
    `Flagged transactions: ${flaggedCount?.count ?? 0}`,
    `Resolved investigations: ${resolvedCount?.count ?? 0}`,
    "",
    "Severity breakdown:",
    ...severityBreakdown.map((s) => `  ${s.severity}: ${s.count}`),
    "",
    "Top triggered rules:",
    ...topRules.map((r) => `  ${r.name}: ${r.count} alerts`),
  ];

  const summaryText = summaryLines.join("\n");

  const [report] = await db
    .insert(reports)
    .values({
      tenantId,
      title,
      dateRangeStart: data.dateRangeStart,
      dateRangeEnd: data.dateRangeEnd,
      totalTransactions: txCount?.count ?? 0,
      totalFlagged: flaggedCount?.count ?? 0,
      totalResolved: resolvedCount?.count ?? 0,
      summaryText,
      createdBy: DEMO_ADMIN_ID,
    })
    .returning();

  return {
    success: true,
    report,
    severityBreakdown,
    topRules,
    recentAudit,
  };
}
