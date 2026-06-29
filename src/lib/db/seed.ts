import { loadEnv } from "./load-env";
loadEnv();

import { eq } from "drizzle-orm";
import { getDb } from "./index";
import {
  tenants,
  tenantUsers,
  transactions,
  rules,
  alerts,
  auditLogs,
} from "./schema";
import {
  DEMO_TENANT_ID,
  DEMO_ADMIN_ID,
  DEMO_ANALYST_1_ID,
  DEMO_ANALYST_2_ID,
} from "@/types";
import { generateId, generateIdempotencyKey } from "@/lib/utils/ids";
import {
  evaluateAllRules,
  buildExplanation,
  type RuleForEval,
} from "@/lib/rules/engine";
import { humanizeRule } from "@/lib/utils/format";

const BATCH_SIZE = 2500;

const SENDER_NAMES = [
  "TechFlow Solutions",
  "Meridian Trading Co",
  "Apex Digital LLC",
  "Quantum Payments Ltd",
  "BlueStar Commerce",
  "NorthEdge Capital",
  "Vertex Marketplace",
  "OceanGate Trading",
  "PrimeShift Inc",
  "Ember Financial Group",
  "Silverline Ventures",
  "Cascade Holdings",
  "Horizon Payments",
  "Nexus Commerce",
  "Pinnacle Trade Co",
  "Summit Digital",
  "Atlas Financial",
  "Crestwave Inc",
  "Delta Exchange",
  "Echo Payments",
  "Fusion Markets",
  "Gateway Trading",
  "Helix Commerce",
  "Ironclad Finance",
  "Jade Capital",
  "Keystone Payments",
  "Luminary Trade",
  "Matrix Commerce",
  "NovaBridge LLC",
  "Orbit Financial",
];

const RECEIVER_NAMES = [
  "Global Supply Co",
  "Pacific Trade Ltd",
  "EuroConnect GmbH",
  "AsiaLink Corp",
  "Americas Wholesale",
  "Digital Commerce Hub",
  "Swift Logistics",
  "Prime Retail Group",
  "Metro Distributors",
  "United Merchants",
];

const COUNTRIES_NORMAL = ["US", "GB"];
const COUNTRIES_ELEVATED = ["US", "GB"];
const COUNTRIES_HIGH_RISK = ["US", "GB"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
const PAYMENT_RAILS = ["ach", "wire", "card", "crypto", "sepa", "swift"];

const SEED_RULES: Omit<RuleForEval, "id">[] = [
  { name: "High-value transfer", metric: "amount", operator: "greater_than", ruleValue: "10000", severity: "high", action: "flag" },
  { name: "Very high-value transfer", metric: "amount", operator: "greater_than", ruleValue: "50000", severity: "critical", action: "escalate" },
  { name: "Cross-border high-value", metric: "country_mismatch", operator: "equals", ruleValue: "true", severity: "high", action: "flag" },
  { name: "UK-origin review", metric: "sender_country", operator: "equals", ruleValue: "GB", severity: "medium", action: "flag" },
  { name: "UK-destination review", metric: "receiver_country", operator: "equals", ruleValue: "GB", severity: "medium", action: "flag" },
  { name: "Crypto rail transfer", metric: "payment_rail", operator: "equals", ruleValue: "crypto", severity: "high", action: "flag" },
  { name: "Extreme risk score", metric: "risk_score", operator: "greater_than", ruleValue: "0.85", severity: "critical", action: "escalate" },
  { name: "Very high risk score", metric: "risk_score", operator: "greater_than", ruleValue: "0.70", severity: "high", action: "flag" },
  { name: "Wire transfer threshold", metric: "payment_rail", operator: "equals", ruleValue: "wire", severity: "medium", action: "flag" },
  { name: "Small suspicious transfers", metric: "amount", operator: "less_than", ruleValue: "50", severity: "medium", action: "flag" },
  { name: "SWIFT large transfer", metric: "payment_rail", operator: "equals", ruleValue: "swift", severity: "high", action: "flag" },
  { name: "Micro-transaction anomaly", metric: "amount", operator: "less_than", ruleValue: "5", severity: "low", action: "flag" },
  { name: "Rapid-fire sender", metric: "tx_count_1h", operator: "greater_than", ruleValue: "10", severity: "high", action: "escalate" },
  { name: "Hourly volume spike", metric: "tx_total_1h", operator: "greater_than", ruleValue: "50000", severity: "critical", action: "escalate" },
  { name: "24-hour accumulation", metric: "tx_total_24h", operator: "greater_than", ruleValue: "200000", severity: "high", action: "flag" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(profile: string): number {
  switch (profile) {
    case "critical":
      return Math.round((10000 + Math.random() * 90000) * 100) / 100;
    case "high":
      return Math.round((5000 + Math.random() * 45000) * 100) / 100;
    case "elevated":
      return Math.round((1000 + Math.random() * 14000) * 100) / 100;
    default:
      return Math.round((5 + Math.random() * 1995) * 100) / 100;
  }
}

function randomRiskScore(profile: string): number {
  switch (profile) {
    case "critical":
      return Math.round((0.75 + Math.random() * 0.24) * 1000) / 1000;
    case "high":
      return Math.round((0.55 + Math.random() * 0.35) * 1000) / 1000;
    case "elevated":
      return Math.round((0.3 + Math.random() * 0.4) * 1000) / 1000;
    default:
      return Math.round(Math.random() * 0.25 * 1000) / 1000;
  }
}

function pickProfile(): string {
  const r = Math.random();
  if (r < 0.01) return "critical";
  if (r < 0.04) return "high";
  if (r < 0.1) return "elevated";
  return "normal";
}

function pickCountries(profile: string): { sender: string; receiver: string } {
  if (profile === "critical" || profile === "high") {
    const sender = pick(COUNTRIES_HIGH_RISK);
    const receiver = pick([...COUNTRIES_NORMAL, ...COUNTRIES_ELEVATED]);
    return { sender, receiver };
  }
  if (profile === "elevated") {
    return {
      sender: pick(COUNTRIES_ELEVATED),
      receiver: pick([...COUNTRIES_NORMAL, ...COUNTRIES_ELEVATED]),
    };
  }
  const country = pick(COUNTRIES_NORMAL);
  return Math.random() > 0.85
    ? { sender: country, receiver: pick(COUNTRIES_NORMAL.filter((c) => c !== country)) }
    : { sender: country, receiver: country };
}

function pickRail(profile: string): string {
  if (profile === "critical") return pick(["wire", "swift", "crypto"]);
  if (profile === "high") return pick(["wire", "swift", "crypto", "ach"]);
  return pick(PAYMENT_RAILS);
}

export async function seedDatabase() {
  const db = await getDb();
  const txCount = Number(process.env.SEED_TX_COUNT || 50000);

  console.log("Seeding Vigil demo data...");

  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, DEMO_TENANT_ID))
    .limit(1);

  if (existing.length > 0) {
    console.log("Demo tenant already exists. Skipping seed.");
    return;
  }

  await db.insert(tenants).values({
    id: DEMO_TENANT_ID,
    name: "NovaPay Technologies",
    industry: "Fintech",
    plan: "pro",
  });

  await db.insert(tenantUsers).values([
    { id: DEMO_ADMIN_ID, tenantId: DEMO_TENANT_ID, email: "aritra@novapay.io", name: "Aritra Sen", role: "admin" },
    { id: DEMO_ANALYST_1_ID, tenantId: DEMO_TENANT_ID, email: "sarah@novapay.io", name: "Sarah Chen", role: "analyst" },
    { id: DEMO_ANALYST_2_ID, tenantId: DEMO_TENANT_ID, email: "marcus@novapay.io", name: "Marcus Rivera", role: "analyst" },
  ]);

  const ruleRecords = SEED_RULES.map((r) => ({
    id: generateId(),
    tenantId: DEMO_TENANT_ID,
    name: r.name,
    description: humanizeRule(r.metric, r.operator, r.ruleValue),
    metric: r.metric,
    operator: r.operator,
    ruleValue: r.ruleValue,
    severity: r.severity,
    action: r.action,
    isActive: true,
  }));

  await db.insert(rules).values(ruleRecords);

  const rulesForEval: RuleForEval[] = ruleRecords.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric as RuleForEval["metric"],
    operator: r.operator as RuleForEval["operator"],
    ruleValue: r.ruleValue,
    severity: r.severity,
    action: r.action,
  }));

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  console.log(`Generating ${txCount} transactions...`);
  const allTxRows: (typeof transactions.$inferInsert)[] = [];
  const txRuleMatches: Map<string, RuleForEval[]> = new Map();

  for (let i = 0; i < txCount; i++) {
    const profile = pickProfile();
    const { sender, receiver } = pickCountries(profile);
    const amount = randomAmount(profile);
    const riskScore = randomRiskScore(profile);
    const createdAt = new Date(now - Math.random() * thirtyDaysMs);
    const id = generateId();

    const txForRules = {
      amount,
      senderCountry: sender,
      receiverCountry: receiver,
      riskScore,
      paymentRail: pickRail(profile),
    };

    const matched = evaluateAllRules(txForRules, rulesForEval);
    let status = "cleared";
    if (matched.length > 0) {
      status = matched.some((r) => r.action === "block") ? "blocked" : "flagged";
      txRuleMatches.set(id, matched);
    }

    allTxRows.push({
      id,
      tenantId: DEMO_TENANT_ID,
      idempotencyKey: generateIdempotencyKey(),
      amount: amount.toFixed(2),
      currency: pick(CURRENCIES),
      senderName: pick(SENDER_NAMES),
      senderCountry: sender,
      receiverName: pick(RECEIVER_NAMES),
      receiverCountry: receiver,
      paymentRail: txForRules.paymentRail,
      riskScore: riskScore.toFixed(3),
      status,
      createdAt,
    });
  }

  for (let i = 0; i < allTxRows.length; i += BATCH_SIZE) {
    const batch = allTxRows.slice(i, i + BATCH_SIZE);
    await db.insert(transactions).values(batch);
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allTxRows.length / BATCH_SIZE)}`);
  }

  console.log("Evaluating rules and generating alerts...");
  const alertRows: (typeof alerts.$inferInsert)[] = [];
  const auditRows: (typeof auditLogs.$inferInsert)[] = [];

  const ALERT_STATUS_DIST = [
    { status: "open", weight: 0.3 },
    { status: "investigating", weight: 0.2 },
    { status: "escalated", weight: 0.1 },
    { status: "resolved", weight: 0.3 },
    { status: "false_positive", weight: 0.1 },
  ];

  function pickAlertStatus(): string {
    const r = Math.random();
    let cumulative = 0;
    for (const s of ALERT_STATUS_DIST) {
      cumulative += s.weight;
      if (r < cumulative) return s.status;
    }
    return "open";
  }

  for (const tx of allTxRows) {
    const matched = txRuleMatches.get(tx.id!);
    if (!matched || matched.length === 0) continue;

    const txForRules = {
      amount: parseFloat(tx.amount as string),
      senderCountry: tx.senderCountry!,
      receiverCountry: tx.receiverCountry!,
      riskScore: parseFloat(tx.riskScore as string),
      paymentRail: tx.paymentRail!,
    };

    for (const rule of matched) {
      const alertId = generateId();
      const alertStatus = pickAlertStatus();
      const assignedTo =
        alertStatus !== "open"
          ? pick([DEMO_ANALYST_1_ID, DEMO_ANALYST_2_ID])
          : null;

      alertRows.push({
        id: alertId,
        tenantId: DEMO_TENANT_ID,
        transactionId: tx.id!,
        ruleId: rule.id,
        title: `${rule.severity.toUpperCase()}: ${rule.name}`,
        severity: rule.severity,
        status: alertStatus,
        explanation: buildExplanation(rule, txForRules),
        assignedTo,
        resolvedAt:
          alertStatus === "resolved" || alertStatus === "false_positive"
            ? new Date(tx.createdAt!.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            : null,
        createdAt: tx.createdAt,
      });

      auditRows.push({
        tenantId: DEMO_TENANT_ID,
        actorId: DEMO_ADMIN_ID,
        actorName: "System",
        action: "alert_created",
        entityType: "alert",
        entityId: alertId,
        detailsText: `Alert opened automatically by rule "${rule.name}"`,
        createdAt: tx.createdAt,
      });

      if (alertStatus !== "open") {
        auditRows.push({
          tenantId: DEMO_TENANT_ID,
          actorId: assignedTo!,
          actorName: assignedTo === DEMO_ANALYST_1_ID ? "Sarah Chen" : "Marcus Rivera",
          action: "status_changed",
          entityType: "alert",
          entityId: alertId,
          detailsText: `Status changed to ${alertStatus}`,
          createdAt: new Date(tx.createdAt!.getTime() + 3600000),
        });
      }
    }
  }

  console.log(`Inserting ${alertRows.length} alerts...`);
  for (let i = 0; i < alertRows.length; i += BATCH_SIZE) {
    await db.insert(alerts).values(alertRows.slice(i, i + BATCH_SIZE));
  }

  console.log(`Inserting ${auditRows.length} audit logs...`);
  for (let i = 0; i < auditRows.length; i += BATCH_SIZE) {
    await db.insert(auditLogs).values(auditRows.slice(i, i + BATCH_SIZE));
  }

  console.log("Seed complete!");
  console.log(`  Transactions: ${txCount}`);
  console.log(`  Alerts: ${alertRows.length}`);
  console.log(`  Audit logs: ${auditRows.length}`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
