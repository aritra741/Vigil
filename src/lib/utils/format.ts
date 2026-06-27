import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(
  amount: number | string,
  currency: string = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatNumber(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy HH:mm");
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatHours(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const points = [...code.toUpperCase()].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...points);
}

export function truncateId(id: string, len: number = 8): string {
  return id.slice(0, len);
}

export function humanizeRule(
  metric: string,
  operator: string,
  value: string
): string {
  const metricLabels: Record<string, string> = {
    amount: "Amount",
    sender_country: "Sender country",
    receiver_country: "Receiver country",
    country_mismatch: "Country mismatch",
    risk_score: "Risk score",
    payment_rail: "Payment rail",
  };
  const opLabels: Record<string, string> = {
    greater_than: ">",
    less_than: "<",
    equals: "=",
    not_equals: "≠",
    in_list: "in",
  };
  const label = metricLabels[metric] ?? metric;
  const op = opLabels[operator] ?? operator;
  if (operator === "in_list") return `${label} in [${value}]`;
  if (metric === "amount") return `${label} ${op} $${Number(value).toLocaleString()}`;
  return `${label} ${op} ${value}`;
}
