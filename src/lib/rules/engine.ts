import type { RuleMetric, RuleOperator } from "@/types";

export interface TransactionForRules {
  amount: number;
  senderCountry: string;
  receiverCountry: string;
  riskScore: number;
  paymentRail: string;
  tx_count_1h?: number;
  tx_total_1h?: number;
  tx_count_24h?: number;
  tx_total_24h?: number;
}

export interface RuleForEval {
  id: string;
  name: string;
  metric: RuleMetric;
  operator: RuleOperator;
  ruleValue: string;
  severity: string;
  action: string;
}

export function evaluateRule(
  transaction: TransactionForRules,
  rule: RuleForEval
): boolean {
  const metricValue = getMetricValue(transaction, rule.metric);
  return applyOperator(metricValue, rule.operator, rule.ruleValue);
}

function getMetricValue(
  tx: TransactionForRules,
  metric: RuleMetric
): string | number {
  switch (metric) {
    case "amount":
      return tx.amount;
    case "sender_country":
      return tx.senderCountry;
    case "receiver_country":
      return tx.receiverCountry;
    case "country_mismatch":
      return tx.senderCountry !== tx.receiverCountry ? "true" : "false";
    case "risk_score":
      return tx.riskScore;
    case "payment_rail":
      return tx.paymentRail;
    case "tx_count_1h":
      return tx.tx_count_1h ?? 0;
    case "tx_total_1h":
      return tx.tx_total_1h ?? 0;
    case "tx_count_24h":
      return tx.tx_count_24h ?? 0;
    case "tx_total_24h":
      return tx.tx_total_24h ?? 0;
    default:
      return "";
  }
}

function applyOperator(
  metricValue: string | number,
  operator: RuleOperator,
  ruleValue: string
): boolean {
  switch (operator) {
    case "greater_than":
      return Number(metricValue) > Number(ruleValue);
    case "less_than":
      return Number(metricValue) < Number(ruleValue);
    case "equals":
      return String(metricValue).toLowerCase() === ruleValue.toLowerCase();
    case "not_equals":
      return String(metricValue).toLowerCase() !== ruleValue.toLowerCase();
    case "in_list": {
      const list = ruleValue.split(",").map((v) => v.trim().toLowerCase());
      return list.includes(String(metricValue).toLowerCase());
    }
    default:
      return false;
  }
}

export function evaluateAllRules(
  transaction: TransactionForRules,
  rules: RuleForEval[]
): RuleForEval[] {
  return rules.filter((rule) => evaluateRule(transaction, rule));
}

export function buildExplanation(
  rule: RuleForEval,
  transaction: TransactionForRules
): string {
  const parts: string[] = [];
  switch (rule.metric) {
    case "amount":
      parts.push(`Transaction amount $${transaction.amount.toLocaleString()}`);
      break;
    case "sender_country":
      parts.push(`Sender country ${transaction.senderCountry}`);
      break;
    case "receiver_country":
      parts.push(`Receiver country ${transaction.receiverCountry}`);
      break;
    case "country_mismatch":
      parts.push(
        `Cross-border transfer: ${transaction.senderCountry} → ${transaction.receiverCountry}`
      );
      break;
    case "risk_score":
      parts.push(`Risk score ${transaction.riskScore.toFixed(3)}`);
      break;
    case "payment_rail":
      parts.push(`Payment rail ${transaction.paymentRail}`);
      break;
    case "tx_count_1h":
      parts.push(`Sender hourly transaction count ${transaction.tx_count_1h ?? 0}`);
      break;
    case "tx_total_1h":
      parts.push(`Sender hourly volume $${(transaction.tx_total_1h ?? 0).toLocaleString()}`);
      break;
    case "tx_count_24h":
      parts.push(`Sender 24h transaction count ${transaction.tx_count_24h ?? 0}`);
      break;
    case "tx_total_24h":
      parts.push(`Sender 24h volume $${(transaction.tx_total_24h ?? 0).toLocaleString()}`);
      break;
  }
  parts.push(`matched rule "${rule.name}"`);
  return parts.join(" — ");
}
