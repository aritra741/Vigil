/** Operational UI design tokens — Datadog/PagerDuty density */

export const SURFACE = {
  page: "#08090a",
  card: "#101113",
  elevated: "#18191c",
  overlay: "#1f2023",
  border: "rgba(255, 255, 255, 0.06)",
  borderDefault: "rgba(255, 255, 255, 0.09)",
  borderEmphasis: "rgba(255, 255, 255, 0.14)",
} as const;

export const SEVERITY = {
  critical: "#f5433d",
  high: "#ee7b30",
  medium: "#e5b847",
  low: "#46b26c",
} as const;

export const SEVERITY_MUTED = {
  critical: "rgba(245, 67, 61, 0.10)",
  high: "rgba(238, 123, 48, 0.10)",
  medium: "rgba(229, 184, 71, 0.08)",
  low: "rgba(70, 178, 108, 0.08)",
} as const;

export type SeverityLevel = keyof typeof SEVERITY;

export function severityBg(severity: string, opacity = 0.12): string {
  const color = SEVERITY[severity as SeverityLevel] ?? "#8b8d98";
  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}

export function severityText(severity: string): string {
  return SEVERITY[severity as SeverityLevel] ?? "#8b8d98";
}

export const TX_STATUS = {
  pending: { bg: "rgba(139,141,152,0.10)", text: "#8b8d98" },
  cleared: { bg: "rgba(70,178,108,0.10)", text: "#46b26c" },
  flagged: { bg: "rgba(238,123,48,0.10)", text: "#ee7b30" },
  blocked: { bg: "rgba(245,67,61,0.10)", text: "#f5433d" },
} as const;

export const ALERT_STATUS = {
  open: { bg: "rgba(139,141,152,0.10)", text: "#8b8d98" },
  investigating: { bg: "rgba(77,148,247,0.10)", text: "#4d94f7" },
  escalated: { bg: "rgba(238,123,48,0.10)", text: "#ee7b30" },
  resolved: { bg: "rgba(70,178,108,0.10)", text: "#46b26c" },
  false_positive: { bg: "rgba(92,94,106,0.10)", text: "#5c5e6a" },
} as const;

export const TEXT = {
  primary: "#ececef",
  secondary: "#8b8d98",
  tertiary: "#5c5e6a",
  inverse: "#08090a",
} as const;

export const ACCENT = {
  accent: "#7c5cfc",
  hover: "#6b4ce6",
  muted: "rgba(124, 92, 252, 0.12)",
  border: "rgba(124, 92, 252, 0.25)",
} as const;
