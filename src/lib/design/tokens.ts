/** Operational UI design tokens — Datadog/PagerDuty density */

export const SURFACE = {
  page: "#0a0a0a",
  card: "#111111",
  elevated: "#1a1a1a",
  border: "#222222",
  rowAlt: "#0f0f0f",
} as const;

export const SEVERITY = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
} as const;

export type SeverityLevel = keyof typeof SEVERITY;

export const METRIC_BORDER = {
  default: "#8b5cf6",
  critical: SEVERITY.critical,
  high: SEVERITY.high,
  medium: SEVERITY.medium,
  low: SEVERITY.low,
  neutral: "#3f3f46",
} as const;

export type MetricBorder = keyof typeof METRIC_BORDER;

export function severityBg(severity: string, opacity = 0.12): string {
  const color = SEVERITY[severity as SeverityLevel] ?? "#71717a";
  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}

export function severityText(severity: string): string {
  return SEVERITY[severity as SeverityLevel] ?? "#a1a1aa";
}

export const TX_STATUS = {
  pending: { bg: "rgba(161,161,170,0.12)", text: "#a1a1aa" },
  cleared: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  flagged: { bg: "rgba(234,179,8,0.12)", text: "#eab308" },
  blocked: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
} as const;

export const ALERT_STATUS = {
  open: { bg: "rgba(161,161,170,0.12)", text: "#a1a1aa" },
  investigating: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa" },
  escalated: { bg: "rgba(249,115,22,0.12)", text: "#f97316" },
  resolved: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  false_positive: { bg: "rgba(113,113,122,0.12)", text: "#71717a" },
} as const;
