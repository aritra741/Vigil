"use server";

import { eq, and, desc, gte, sql, count, sum, inArray } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import {
  transactions,
  tenants,
  alerts,
  rules,
} from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { generateId } from "@/lib/utils/ids";
import { addMockTransaction, getMockBurstTransaction } from "@/lib/demo/mock-db";
import {
  evaluateAllRules,
  buildExplanation,
  type RuleForEval,
} from "@/lib/rules/engine";
import { withRetry } from "@/lib/utils/retry";
import type { RuleMetric, RuleOperator } from "@/types";
import { auditLogs } from "@/lib/db/schema";
import { DEMO_ADMIN_ID } from "@/types";
import {
  DEMO_METRICS,
  DEMO_RISK_TREND,
  DEMO_SEVERITY,
  DEMO_RECENT_ALERTS,
  DEMO_TRANSACTIONS,
} from "@/lib/demo/data";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";

type Db = NodePgDatabase<typeof schema & typeof relations>;

const BURST_PROFILES: Array<{
  profile: "normal" | "critical" | "high";
  idempotencyKey: string;
}> = [
  { profile: "normal", idempotencyKey: "burst_sim_normal_1" },
  { profile: "normal", idempotencyKey: "burst_sim_normal_2" },
  { profile: "high", idempotencyKey: "burst_sim_high_1" },
  { profile: "critical", idempotencyKey: "burst_sim_critical_1" },
  { profile: "critical", idempotencyKey: "burst_sim_critical_2" },
];

export interface DashboardMetrics {
  transactionsToday: number;
  flaggedCount: number;
  valueUnderReview: number;
  openInvestigations: number;
  avgResolutionHours: number;
  ruleHitRate: number;
  totalTransactions: number;
  tenantName: string;
}

export interface RiskTrendPoint {
  date: string;
  flagged: number;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
}

export interface BurstAlertSummary {
  id: string;
  title: string;
  severity: string;
  amount: string;
  currency: string;
  senderCountry: string;
  receiverCountry: string;
}

export interface SimulatedTransactionRow {
  id: string;
  amount: string;
  currency: string;
  senderName: string;
  senderCountry: string;
  receiverName: string;
  receiverCountry: string;
  paymentRail: string;
  riskScore: string;
  status: string;
  createdAt: Date;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!isDbConfigured()) return getEmptyMetrics();
  const db = await getDb();
  const tenantId = await getTenantId();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const [txToday] = await db
    .select({ count: count() })
    .from(transactions)
    .where(
      and(eq(transactions.tenantId, tenantId), gte(transactions.createdAt, today))
    );

  const [flagged] = await db
    .select({ count: count() })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        inArray(transactions.status, ["flagged", "blocked"])
      )
    );

  const [total] = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.tenantId, tenantId));

  const [underReview] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(eq(transactions.tenantId, tenantId), eq(transactions.status, "flagged"))
    );

  const [openAlerts] = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        inArray(alerts.status, ["open", "investigating", "escalated"])
      )
    );

  const [resolved] = await db
    .select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (${alerts.resolvedAt} - ${alerts.createdAt})) * 1000)`,
    })
    .from(alerts)
    .where(
      and(eq(alerts.tenantId, tenantId), eq(alerts.status, "resolved"))
    );

  const [alertCount] = await db
    .select({ count: count() })
    .from(alerts)
    .where(eq(alerts.tenantId, tenantId));

  const totalTx = total?.count ?? 0;
  const totalAlerts = alertCount?.count ?? 0;

  if (totalTx === 0) return DEMO_METRICS;

  return {
    transactionsToday: txToday?.count ?? 0,
    flaggedCount: flagged?.count ?? 0,
    valueUnderReview: parseFloat(underReview?.total ?? "0"),
    openInvestigations: openAlerts?.count ?? 0,
    avgResolutionHours: (resolved?.avgMs ?? 0) / (1000 * 60 * 60),
    ruleHitRate: totalTx > 0 ? (totalAlerts / totalTx) * 100 : 0,
    totalTransactions: totalTx,
    tenantName: tenant?.name ?? "NovaPay Technologies",
  };
}

function getEmptyMetrics(): DashboardMetrics {
  return DEMO_METRICS;
}

export async function getRiskTrend(): Promise<RiskTrendPoint[]> {
  if (!isDbConfigured()) return DEMO_RISK_TREND;
  const db = await getDb();
  const tenantId = await getTenantId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await db
    .select({
      date: sql<string>`DATE(${transactions.createdAt})`,
      flagged: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        gte(transactions.createdAt, sevenDaysAgo),
        inArray(transactions.status, ["flagged", "blocked"])
      )
    )
    .groupBy(sql`DATE(${transactions.createdAt})`)
    .orderBy(sql`DATE(${transactions.createdAt})`);

  return rows.length > 0
    ? rows.map((r) => ({ date: r.date, flagged: r.flagged }))
    : DEMO_RISK_TREND;
}

export async function getSeverityBreakdown(): Promise<SeverityBreakdown[]> {
  if (!isDbConfigured()) return DEMO_SEVERITY;
  const db = await getDb();
  const tenantId = await getTenantId();

  const rows = await db
    .select({ severity: alerts.severity, count: count() })
    .from(alerts)
    .where(eq(alerts.tenantId, tenantId))
    .groupBy(alerts.severity);

  return rows.length > 0
    ? rows.map((r) => ({ severity: r.severity, count: r.count }))
    : DEMO_SEVERITY;
}

export async function getRecentCriticalAlerts(limit: number = 5) {
  if (!isDbConfigured()) return DEMO_RECENT_ALERTS.slice(0, limit);
  const db = await getDb();
  const tenantId = await getTenantId();

  const results = await db
    .select({
      id: alerts.id,
      title: alerts.title,
      severity: alerts.severity,
      status: alerts.status,
      createdAt: alerts.createdAt,
      amount: transactions.amount,
      currency: transactions.currency,
    })
    .from(alerts)
    .innerJoin(transactions, eq(alerts.transactionId, transactions.id))
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        inArray(alerts.severity, ["critical", "high"])
      )
    )
    .orderBy(desc(alerts.createdAt))
    .limit(limit);

  return results.length > 0 ? results : DEMO_RECENT_ALERTS.slice(0, limit);
}

export interface TransactionFilters {
  page?: number;
  pageSize?: number;
  status?: string[];
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export async function listTransactions(filters: TransactionFilters = {}) {
  if (!isDbConfigured()) {
    return { rows: DEMO_TRANSACTIONS, total: 48900 };
  }
  const db = await getDb();
  const tenantId = await getTenantId();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(transactions.tenantId, tenantId)];
  if (filters.status?.length) {
    conditions.push(inArray(transactions.status, filters.status));
  }
  if (filters.search) {
    conditions.push(
      sql`(${transactions.senderName} ILIKE ${"%" + filters.search + "%"} OR ${transactions.receiverName} ILIKE ${"%" + filters.search + "%"})`
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(transactions)
    .where(where);

  const sortCol =
    filters.sortBy === "amount"
      ? transactions.amount
      : filters.sortBy === "riskScore"
        ? transactions.riskScore
        : transactions.createdAt;

  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(filters.sortDir === "asc" ? sortCol : desc(sortCol))
    .limit(pageSize)
    .offset(offset);

  if (rows.length === 0 && page === 1) {
    return { rows: DEMO_TRANSACTIONS, total: 48900 };
  }

  return { rows, total: totalResult?.count ?? 0 };
}

export async function getOpenAlertCount(): Promise<number> {
  if (!isDbConfigured()) return 104;
  const db = await getDb();
  const tenantId = await getTenantId();
  const [result] = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.tenantId, tenantId),
        inArray(alerts.status, ["open", "investigating", "escalated"])
      )
    );
  return result?.count ?? 104;
}

function generateSimulatedTransaction(profile: "normal" | "critical" | "high") {
  const profiles = {
    normal: {
      amount: 500 + Math.random() * 5000,
      riskScore: 0.1 + Math.random() * 0.3,
      senderCountry: "US",
      receiverCountry: "US",
      paymentRail: "ach",
    },
    high: {
      amount: 15000 + Math.random() * 35000,
      riskScore: 0.6 + Math.random() * 0.2,
      senderCountry: "US",
      receiverCountry: "GB",
      paymentRail: "wire",
    },
    critical: {
      amount: 40000 + Math.random() * 60000,
      riskScore: 0.85 + Math.random() * 0.1,
      senderCountry: "GB",
      receiverCountry: "US",
      paymentRail: "swift",
    },
  };

  const p = profiles[profile];
  return {
    amount: Math.round(p.amount * 100) / 100,
    riskScore: Math.round(p.riskScore * 1000) / 1000,
    senderCountry: p.senderCountry,
    receiverCountry: p.receiverCountry,
    paymentRail: p.paymentRail,
    senderName: ["TechFlow Solutions", "Quantum Payments Ltd", "Apex Digital LLC"][
      Math.floor(Math.random() * 3)
    ],
    receiverName: ["Global Supply Co", "Pacific Trade Ltd", "EuroConnect GmbH"][
      Math.floor(Math.random() * 3)
    ],
    currency: "USD",
  };
}

async function getVelocityStats(db: any, tenantId: string, senderName: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [oneHour] = await db
    .select({
      count: count(),
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.senderName, senderName),
        gte(transactions.createdAt, oneHourAgo)
      )
    );

  const [twentyFourHours] = await db
    .select({
      count: count(),
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.senderName, senderName),
        gte(transactions.createdAt, twentyFourHoursAgo)
      )
    );

  return {
    tx_count_1h: oneHour?.count ?? 0,
    tx_total_1h: parseFloat(oneHour?.total ?? "0"),
    tx_count_24h: twentyFourHours?.count ?? 0,
    tx_total_24h: parseFloat(twentyFourHours?.total ?? "0"),
  };
}

async function insertTransactionIdempotent(
  db: Db,
  tenantId: string,
  values: typeof transactions.$inferInsert
): Promise<{ tx: typeof transactions.$inferSelect; isNew: boolean }> {
  const inserted = await withRetry(() =>
    db
      .insert(transactions)
      .values(values)
      .onConflictDoNothing({
        target: [transactions.tenantId, transactions.idempotencyKey],
      })
      .returning()
  );

  if (inserted.length > 0) {
    return { tx: inserted[0], isNew: true };
  }

  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.idempotencyKey, values.idempotencyKey)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Failed to resolve idempotent transaction insert");
  }

  return { tx: existing, isNew: false };
}

async function createAlertsForTransaction(
  db: Db,
  tenantId: string,
  tx: typeof transactions.$inferSelect,
  matched: RuleForEval[],
  txForRules: Parameters<typeof buildExplanation>[1]
): Promise<BurstAlertSummary[]> {
  if (matched.length === 0) return [];

  const existingAlerts = await db
    .select({ ruleId: alerts.ruleId })
    .from(alerts)
    .where(
      and(eq(alerts.tenantId, tenantId), eq(alerts.transactionId, tx.id))
    );

  const existingRuleIds = new Set(existingAlerts.map((a) => a.ruleId));
  const created: BurstAlertSummary[] = [];

  for (const rule of matched) {
    if (existingRuleIds.has(rule.id)) continue;

    await withRetry(() =>
      db.transaction(async (txn) => {
        const alertId = generateId();
        await txn.insert(alerts).values({
          id: alertId,
          tenantId,
          transactionId: tx.id,
          ruleId: rule.id,
          title: `${rule.severity.toUpperCase()}: ${rule.name}`,
          severity: rule.severity,
          status: "open",
          explanation: buildExplanation(rule, txForRules),
        });

        await txn.insert(auditLogs).values({
          tenantId,
          actorId: DEMO_ADMIN_ID,
          actorName: "System",
          action: "alert_created",
          entityType: "alert",
          entityId: alertId,
          detailsText: `Alert opened automatically by rule "${rule.name}"`,
        });
      })
    );

    created.push({
      id: tx.id,
      title: `${rule.severity.toUpperCase()}: ${rule.name}`,
      severity: rule.severity,
      amount: tx.amount,
      currency: tx.currency,
      senderCountry: tx.senderCountry,
      receiverCountry: tx.receiverCountry,
    });
  }

  return created;
}

export async function simulateTransactionBurst(): Promise<{
  success: boolean;
  error?: string;
  transactions?: SimulatedTransactionRow[];
  alerts?: BurstAlertSummary[];
  alertsCreated?: number;
  idempotentReplay?: boolean;
}> {
  if (!isDbConfigured()) {
    const insertedTx: SimulatedTransactionRow[] = [];
    const createdAlerts: BurstAlertSummary[] = [];
    let alertsCreated = 0;

    for (const { profile, idempotencyKey } of BURST_PROFILES) {
      const data = generateSimulatedTransaction(profile);
      const severity =
        profile === "critical" ? "critical" : profile === "high" ? "high" : "medium";
      const status =
        profile === "normal" ? "cleared" : profile === "critical" ? "blocked" : "flagged";

      const existing = getMockBurstTransaction(idempotencyKey);
      if (existing) {
        insertedTx.push({
          id: existing.id,
          amount: existing.amount.toFixed(2),
          currency: "USD",
          senderName: existing.senderName,
          senderCountry: existing.senderCountry,
          receiverName: existing.receiverName,
          receiverCountry: existing.receiverCountry,
          paymentRail: data.paymentRail,
          riskScore: data.riskScore.toFixed(3),
          status: existing.status,
          createdAt: existing.createdAt,
        });
        continue;
      }

      const mockTx = addMockTransaction(
        {
          senderCountry: data.senderCountry,
          receiverCountry: data.receiverCountry,
          amount: data.amount,
          status,
          ruleName:
            profile === "critical" ? "Extreme risk score" : "High-value transfer",
          severity,
          senderName: data.senderName,
          receiverName: data.receiverName,
          title: `${severity.toUpperCase()}: ${profile === "critical" ? "Extreme risk score" : "High-value transfer"}`,
        },
        idempotencyKey
      );

      insertedTx.push({
        id: mockTx.id,
        amount: mockTx.amount.toFixed(2),
        currency: "USD",
        senderName: mockTx.senderName,
        senderCountry: mockTx.senderCountry,
        receiverName: mockTx.receiverName,
        receiverCountry: mockTx.receiverCountry,
        paymentRail: data.paymentRail,
        riskScore: data.riskScore.toFixed(3),
        status: mockTx.status,
        createdAt: mockTx.createdAt,
      });

      if (status === "flagged" || status === "blocked") {
        alertsCreated++;
        createdAlerts.push({
          id: mockTx.id,
          title: mockTx.title,
          severity,
          amount: mockTx.amount.toFixed(2),
          currency: "USD",
          senderCountry: mockTx.senderCountry,
          receiverCountry: mockTx.receiverCountry,
        });
      }
    }

    return {
      success: true,
      transactions: insertedTx,
      alerts: createdAlerts,
      alertsCreated,
      idempotentReplay: alertsCreated === 0,
    };
  }

  const db = await getDb();
  const tenantId = await getTenantId();

  const activeRules = await db
    .select()
    .from(rules)
    .where(and(eq(rules.tenantId, tenantId), eq(rules.isActive, true)));

  const rulesForEval: RuleForEval[] = activeRules.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric as RuleMetric,
    operator: r.operator as RuleOperator,
    ruleValue: r.ruleValue,
    severity: r.severity,
    action: r.action,
  }));

  const insertedTx: SimulatedTransactionRow[] = [];
  const createdAlerts: BurstAlertSummary[] = [];
  let alertsCreated = 0;
  let newTransactions = 0;

  for (const { profile, idempotencyKey } of BURST_PROFILES) {
    const data = generateSimulatedTransaction(profile);

    const velocity = await getVelocityStats(db, tenantId, data.senderName);

    const txForRules = {
      amount: data.amount,
      senderCountry: data.senderCountry,
      receiverCountry: data.receiverCountry,
      riskScore: data.riskScore,
      paymentRail: data.paymentRail,
      ...velocity,
    };

    const matched = evaluateAllRules(txForRules, rulesForEval);
    const status =
      matched.length === 0
        ? "cleared"
        : matched.some((r) => r.action === "block")
          ? "blocked"
          : "flagged";

    const { tx, isNew } = await insertTransactionIdempotent(db, tenantId, {
      tenantId,
      idempotencyKey,
      amount: data.amount.toFixed(2),
      currency: data.currency,
      senderName: data.senderName,
      senderCountry: data.senderCountry,
      receiverName: data.receiverName,
      receiverCountry: data.receiverCountry,
      paymentRail: data.paymentRail,
      riskScore: data.riskScore.toFixed(3),
      status,
    });

    insertedTx.push(tx);
    if (isNew) newTransactions++;

    const newAlerts = await createAlertsForTransaction(
      db,
      tenantId,
      tx,
      matched,
      txForRules
    );
    alertsCreated += newAlerts.length;
    createdAlerts.push(...newAlerts);
  }

  return {
    success: true,
    transactions: insertedTx,
    alerts: createdAlerts,
    alertsCreated,
    idempotentReplay: newTransactions === 0,
  };
}

export async function ingestTransaction(data: {
  amount: number;
  currency: string;
  senderName: string;
  senderCountry: string;
  receiverName: string;
  receiverCountry: string;
  paymentRail: string;
  riskScore: number;
  idempotencyKey: string;
}) {
  if (!isDbConfigured()) throw new Error("Database not configured");
  const db = await getDb();
  const tenantId = await getTenantId();

  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.idempotencyKey, data.idempotencyKey)
      )
    )
    .limit(1);

  if (existing) return existing;

  const activeRules = await db
    .select()
    .from(rules)
    .where(and(eq(rules.tenantId, tenantId), eq(rules.isActive, true)));

  const rulesForEval: RuleForEval[] = activeRules.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric as RuleMetric,
    operator: r.operator as RuleOperator,
    ruleValue: r.ruleValue,
    severity: r.severity,
    action: r.action,
  }));

  const velocity = await getVelocityStats(db, tenantId, data.senderName);

  const txForRules = {
    amount: data.amount,
    senderCountry: data.senderCountry,
    receiverCountry: data.receiverCountry,
    riskScore: data.riskScore,
    paymentRail: data.paymentRail,
    ...velocity,
  };

  const matched = evaluateAllRules(txForRules, rulesForEval);
  const status =
    matched.length === 0
      ? "cleared"
      : matched.some((r) => r.action === "block")
        ? "blocked"
        : "flagged";

  const { tx } = await insertTransactionIdempotent(db, tenantId, {
    tenantId,
    idempotencyKey: data.idempotencyKey,
    amount: data.amount.toFixed(2),
    currency: data.currency,
    senderName: data.senderName,
    senderCountry: data.senderCountry,
    receiverName: data.receiverName,
    receiverCountry: data.receiverCountry,
    paymentRail: data.paymentRail,
    riskScore: data.riskScore.toFixed(3),
    status,
  });

  return tx;
}

export async function getTopRulesPerformance() {
  if (!isDbConfigured()) {
    return [
      { name: "High-value transfer", count: 124 },
      { name: "UK-origin review", count: 86 },
      { name: "Crypto rail transfer", count: 48 },
      { name: "Extreme risk score", count: 32 },
      { name: "Rapid-fire sender", count: 19 },
    ];
  }

  const db = await getDb();
  const tenantId = await getTenantId();

  const res = await db
    .select({
      name: rules.name,
      count: sql<number>`count(${alerts.id})::int`,
    })
    .from(alerts)
    .innerJoin(rules, eq(alerts.ruleId, rules.id))
    .where(eq(alerts.tenantId, tenantId))
    .groupBy(rules.name)
    .orderBy(desc(sql`count(${alerts.id})`))
    .limit(5);

  return res;
}
