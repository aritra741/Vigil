export const TRANSACTION_STATUSES = [
  "pending",
  "cleared",
  "flagged",
  "blocked",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const ALERT_STATUSES = [
  "open",
  "investigating",
  "escalated",
  "resolved",
  "false_positive",
] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const RULE_METRICS = [
  "amount",
  "sender_country",
  "receiver_country",
  "country_mismatch",
  "risk_score",
  "payment_rail",
  "tx_count_1h",
  "tx_total_1h",
  "tx_count_24h",
  "tx_total_24h",
] as const;
export type RuleMetric = (typeof RULE_METRICS)[number];

export const RULE_OPERATORS = [
  "greater_than",
  "less_than",
  "equals",
  "not_equals",
  "in_list",
] as const;
export type RuleOperator = (typeof RULE_OPERATORS)[number];

export const RULE_ACTIONS = ["flag", "block", "escalate"] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];

export const USER_ROLES = ["admin", "analyst", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TENANT_PLANS = ["free", "pro", "enterprise"] as const;
export type TenantPlan = (typeof TENANT_PLANS)[number];

export const PAYMENT_RAILS = [
  "ach",
  "wire",
  "card",
  "crypto",
  "sepa",
  "swift",
] as const;
export type PaymentRail = (typeof PAYMENT_RAILS)[number];

export const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_ADMIN_ID = "00000000-0000-4000-8000-000000000010";
export const DEMO_ANALYST_1_ID = "00000000-0000-4000-8000-000000000011";
export const DEMO_ANALYST_2_ID = "00000000-0000-4000-8000-000000000012";
