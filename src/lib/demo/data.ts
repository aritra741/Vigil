import type { DashboardMetrics, RiskTrendPoint, SeverityBreakdown } from "@/lib/actions/transactions";
import type { Transaction } from "@/lib/db/schema";
import { DEMO_TENANT_ID } from "@/types";

export const DEMO_METRICS: DashboardMetrics = {
  transactionsToday: 4892,
  flaggedCount: 312,
  valueUnderReview: 2_840_000,
  openInvestigations: 42,
  avgResolutionHours: 4.2,
  ruleHitRate: 1.8,
  totalTransactions: 48_900,
  tenantName: "NovaPay Technologies",
};

export const DEMO_TRENDS = {
  transactionsToday: "↑ 12% vs yesterday",
  flaggedCount: "↑ 8% vs yesterday",
  valueUnderReview: "↑ 3% vs last week",
  openInvestigations: "↓ 5% vs yesterday",
  avgResolutionHours: "↓ 18% vs last week",
  ruleHitRate: "↑ 0.2pp vs yesterday",
};

export const DEMO_RISK_TREND: RiskTrendPoint[] = [
  { date: "2026-06-12", flagged: 38 },
  { date: "2026-06-13", flagged: 45 },
  { date: "2026-06-14", flagged: 41 },
  { date: "2026-06-15", flagged: 52 },
  { date: "2026-06-16", flagged: 48 },
  { date: "2026-06-17", flagged: 55 },
  { date: "2026-06-18", flagged: 47 },
];

export const DEMO_SEVERITY: SeverityBreakdown[] = [
  { severity: "critical", count: 28 },
  { severity: "high", count: 89 },
  { severity: "medium", count: 156 },
  { severity: "low", count: 74 },
];

export const DEMO_RECENT_ALERTS = [
  {
    id: "d0000001-0000-4000-8000-000000000001",
    title: "CRITICAL: Very high-value transfer",
    severity: "critical",
    status: "open",
    createdAt: new Date(Date.now() - 12 * 60_000),
    amount: "48700.00",
    currency: "USD",
  },
  {
    id: "d0000001-0000-4000-8000-000000000002",
    title: "HIGH: Cross-border high-value",
    severity: "high",
    status: "investigating",
    createdAt: new Date(Date.now() - 45 * 60_000),
    amount: "23100.00",
    currency: "USD",
  },
  {
    id: "d0000001-0000-4000-8000-000000000003",
    title: "HIGH: Cross-border review",
    severity: "high",
    status: "open",
    createdAt: new Date(Date.now() - 2 * 3600_000),
    amount: "15800.00",
    currency: "USD",
  },
  {
    id: "d0000001-0000-4000-8000-000000000004",
    title: "CRITICAL: Extreme risk score",
    severity: "critical",
    status: "escalated",
    createdAt: new Date(Date.now() - 4 * 3600_000),
    amount: "92400.00",
    currency: "USD",
  },
  {
    id: "d0000001-0000-4000-8000-000000000005",
    title: "HIGH: Wire transfer threshold",
    severity: "high",
    status: "investigating",
    createdAt: new Date(Date.now() - 6 * 3600_000),
    amount: "31200.00",
    currency: "USD",
  },
];

function daysAgo(n: number, h = 12, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "t001", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-1", amount: "48700.00", currency: "USD", senderName: "Quantum Payments Ltd", senderCountry: "GB", receiverName: "Pacific Trade Ltd", receiverCountry: "US", paymentRail: "swift", riskScore: "0.912", status: "flagged", metadataText: null, createdAt: daysAgo(0, 2, 14) },
  { id: "t002", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-2", amount: "23100.00", currency: "USD", senderName: "TechFlow Solutions", senderCountry: "US", receiverName: "EuroConnect GmbH", receiverCountry: "GB", paymentRail: "wire", riskScore: "0.781", status: "flagged", metadataText: null, createdAt: daysAgo(0, 4, 32) },
  { id: "t003", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-3", amount: "1245.50", currency: "USD", senderName: "BlueStar Commerce", senderCountry: "US", receiverName: "Global Supply Co", receiverCountry: "US", paymentRail: "ach", riskScore: "0.142", status: "cleared", metadataText: null, createdAt: daysAgo(0, 6, 8) },
  { id: "t004", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-4", amount: "15800.00", currency: "USD", senderName: "Apex Digital LLC", senderCountry: "GB", receiverName: "Americas Wholesale", receiverCountry: "US", paymentRail: "wire", riskScore: "0.724", status: "flagged", metadataText: null, createdAt: daysAgo(0, 8, 45) },
  { id: "t005", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-5", amount: "892.00", currency: "EUR", senderName: "Meridian Trading Co", senderCountry: "GB", receiverName: "Metro Distributors", receiverCountry: "GB", paymentRail: "sepa", riskScore: "0.089", status: "cleared", metadataText: null, createdAt: daysAgo(0, 10, 12) },
  { id: "t006", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-6", amount: "92400.00", currency: "USD", senderName: "NorthEdge Capital", senderCountry: "US", receiverName: "Swift Logistics", receiverCountry: "GB", paymentRail: "swift", riskScore: "0.891", status: "blocked", metadataText: null, createdAt: daysAgo(1, 3, 22) },
  { id: "t007", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-7", amount: "5600.00", currency: "USD", senderName: "Vertex Marketplace", senderCountry: "US", receiverName: "Prime Retail Group", receiverCountry: "US", paymentRail: "card", riskScore: "0.234", status: "cleared", metadataText: null, createdAt: daysAgo(1, 9, 5) },
  { id: "t008", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-8", amount: "31200.00", currency: "USD", senderName: "OceanGate Trading", senderCountry: "GB", receiverName: "United Merchants", receiverCountry: "US", paymentRail: "wire", riskScore: "0.698", status: "flagged", metadataText: null, createdAt: daysAgo(1, 14, 18) },
  { id: "t009", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-9", amount: "45.00", currency: "USD", senderName: "PrimeShift Inc", senderCountry: "US", receiverName: "Digital Commerce Hub", receiverCountry: "GB", paymentRail: "crypto", riskScore: "0.612", status: "flagged", metadataText: null, createdAt: daysAgo(2, 7, 33) },
  { id: "t010", tenantId: DEMO_TENANT_ID, idempotencyKey: "demo-10", amount: "1875.25", currency: "CAD", senderName: "Ember Financial Group", senderCountry: "CA", receiverName: "Cascade Holdings", receiverCountry: "CA", paymentRail: "ach", riskScore: "0.156", status: "cleared", metadataText: null, createdAt: daysAgo(2, 11, 50) },
];

export const DEMO_ALERT_ROWS = [
  { id: DEMO_RECENT_ALERTS[0].id, title: DEMO_RECENT_ALERTS[0].title, severity: "critical", status: "open", createdAt: DEMO_RECENT_ALERTS[0].createdAt, assignedTo: null, ruleName: "Very high-value transfer", amount: "48700.00", currency: "USD", senderCountry: "GB", receiverCountry: "US" },
  { id: DEMO_RECENT_ALERTS[1].id, title: DEMO_RECENT_ALERTS[1].title, severity: "high", status: "investigating", createdAt: DEMO_RECENT_ALERTS[1].createdAt, assignedTo: null, ruleName: "Cross-border high-value", amount: "23100.00", currency: "USD", senderCountry: "US", receiverCountry: "GB" },
  { id: DEMO_RECENT_ALERTS[2].id, title: DEMO_RECENT_ALERTS[2].title, severity: "high", status: "open", createdAt: DEMO_RECENT_ALERTS[2].createdAt, assignedTo: null, ruleName: "Cross-border high-value", amount: "15800.00", currency: "USD", senderCountry: "GB", receiverCountry: "US" },
  { id: DEMO_RECENT_ALERTS[3].id, title: DEMO_RECENT_ALERTS[3].title, severity: "critical", status: "escalated", createdAt: DEMO_RECENT_ALERTS[3].createdAt, assignedTo: null, ruleName: "Extreme risk score", amount: "92400.00", currency: "USD", senderCountry: "US", receiverCountry: "GB" },
  { id: "d0000001-0000-4000-8000-000000000006", title: "MEDIUM: Cross-border review", severity: "medium", status: "open", createdAt: daysAgo(0, 1, 5), assignedTo: null, ruleName: "Cross-border high-value", amount: "8200.00", currency: "USD", senderCountry: "US", receiverCountry: "GB" },
  { id: "d0000001-0000-4000-8000-000000000007", title: "LOW: Micro-transaction anomaly", severity: "low", status: "resolved", createdAt: daysAgo(1, 16, 20), assignedTo: null, ruleName: "Micro-transaction anomaly", amount: "3.50", currency: "USD", senderCountry: "US", receiverCountry: "US" },
];

export const DEMO_ALERT_COUNTS: Record<string, number> = {
  all: 347,
  open: 104,
  investigating: 69,
  escalated: 35,
  resolved: 104,
  false_positive: 35,
};

export const DEMO_OPEN_ALERT_COUNT = 104;
