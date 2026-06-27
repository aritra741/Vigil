"use server";

import { eq, and, count, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { rules, alerts, auditLogs } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { withRetry } from "@/lib/utils/retry";
import { DEMO_ADMIN_ID } from "@/types";
import type { RuleMetric, RuleOperator, Severity, RuleAction } from "@/types";

export async function listRules() {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const tenantId = await getTenantId();

  const ruleList = await db
    .select()
    .from(rules)
    .where(eq(rules.tenantId, tenantId))
    .orderBy(desc(rules.createdAt));

  const alertCounts = await db
    .select({ ruleId: alerts.ruleId, count: count() })
    .from(alerts)
    .where(eq(alerts.tenantId, tenantId))
    .groupBy(alerts.ruleId);

  const countMap = new Map(alertCounts.map((a) => [a.ruleId, a.count]));

  return ruleList.map((r) => ({
    ...r,
    alertCount: countMap.get(r.id) ?? 0,
  }));
}

export async function createRule(data: {
  name: string;
  description?: string;
  metric: RuleMetric;
  operator: RuleOperator;
  ruleValue: string;
  severity: Severity;
  action: RuleAction;
}) {
  if (!isDbConfigured()) return { success: false, error: "Database not configured" };
  const db = await getDb();
  const tenantId = await getTenantId();

  const [rule] = await withRetry(() =>
    db
      .insert(rules)
      .values({
        tenantId,
        name: data.name,
        description: data.description,
        metric: data.metric,
        operator: data.operator,
        ruleValue: data.ruleValue,
        severity: data.severity,
        action: data.action,
      })
      .returning()
  );

  await db.insert(auditLogs).values({
    tenantId,
    actorId: DEMO_ADMIN_ID,
    actorName: "Aritra Sen",
    action: "rule_created",
    entityType: "rule",
    entityId: rule.id,
    detailsText: `Created rule "${data.name}"`,
  });

  return { success: true, rule };
}

export async function toggleRule(ruleId: string, isActive: boolean, version: number) {
  if (!isDbConfigured()) return { success: false };
  const db = await getDb();
  const tenantId = await getTenantId();

  const result = await withRetry(async () => {
    const updated = await db
      .update(rules)
      .set({ isActive, version: version + 1, updatedAt: new Date() })
      .where(
        and(
          eq(rules.id, ruleId),
          eq(rules.version, version),
          eq(rules.tenantId, tenantId)
        )
      )
      .returning();

    if (updated.length === 0) throw new Error("Concurrent modification");
    return updated[0];
  });

  return { success: true, rule: result };
}

export async function deleteRule(ruleId: string) {
  if (!isDbConfigured()) return { success: false };
  const db = await getDb();
  const tenantId = await getTenantId();

  await db.delete(rules).where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)));

  await db.insert(auditLogs).values({
    tenantId,
    actorId: DEMO_ADMIN_ID,
    actorName: "Aritra Sen",
    action: "rule_deleted",
    entityType: "rule",
    entityId: ruleId,
    detailsText: "Rule deleted",
  });

  return { success: true };
}
