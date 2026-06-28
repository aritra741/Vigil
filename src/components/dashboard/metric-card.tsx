"use client";

import Link from "next/link";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "@/lib/utils";
import { SURFACE, SEVERITY, SEVERITY_MUTED } from "@/lib/design/tokens";
import {
  CreditCard,
  AlertTriangle,
  DollarSign,
  Search,
  Clock,
  Percent,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "credit-card": CreditCard,
  "alert-triangle": AlertTriangle,
  "dollar-sign": DollarSign,
  search: Search,
  clock: Clock,
  percent: Percent,
};

interface MetricCardProps {
  title: string;
  value: number;
  format?: "number" | "currency" | "percent" | "compact";
  href?: string;
  severity?: "critical" | "high" | "medium" | "low" | "neutral";
  iconName?: keyof typeof ICONS;
  trend?: string; // e.g. "↑ 12% vs yesterday" or "↓ 4% vs yesterday"
}

function generateSparklinePath(value: number, title: string) {
  // Generate 7 deterministic points based on the value and string hash
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seedPoints = [
    12 + (hash % 12),
    16 + ((hash * 2) % 10),
    6 + ((hash * 3) % 18),
    22 + ((hash * 4) % 6),
    10 + ((hash * 5) % 14),
    20 + ((hash * 6) % 8),
    Math.min(26, Math.max(2, (value % 25) + 3))
  ];
  
  const width = 160;
  const height = 28;
  const points = seedPoints.map((val, idx) => {
    const x = (idx * width) / 6;
    const y = height - (val / 30) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  return `M ${points.join(" L ")}`;
}

export function MetricCard({
  title,
  value,
  format = "number",
  href,
  severity = "neutral",
  iconName,
  trend,
}: MetricCardProps) {
  const Icon = iconName ? ICONS[iconName] : null;
  const isDanger = severity === "critical" || severity === "high";

  // Build semantic styles
  const leftBorderColor = severity !== "neutral" ? SEVERITY[severity] : null;
  const glowStyle = isDanger
    ? {
        boxShadow: `inset 0 0 0 1px ${SEVERITY_MUTED[severity]}, 0 0 24px ${
          severity === "critical" ? "rgba(245, 67, 61, 0.04)" : "rgba(238, 123, 48, 0.04)"
        }`,
      }
    : undefined;

  // Determine trend text color
  let trendColorClass = "text-[#5c5e6a]"; // Neutral/tertiary
  if (trend) {
    if (trend.startsWith("↑")) {
      trendColorClass = severity === "critical" || severity === "high" ? "text-[#f5433d]" : "text-[#46b26c]";
    } else if (trend.startsWith("↓")) {
      trendColorClass = severity === "critical" || severity === "high" ? "text-[#46b26c]" : "text-[#f5433d]";
    }
  }

  const content = (
    <div
      className="relative rounded-md overflow-hidden transition-all duration-150 p-5 min-h-[120px] select-none group"
      style={{
        backgroundColor: SURFACE.card, // Ground #101113
        border: `1px solid ${SURFACE.border}`, // Subtle borders
        borderLeft: leftBorderColor ? `3px solid ${leftBorderColor}` : undefined,
        ...glowStyle,
      }}
    >
      {/* Eyebrow Row */}
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-[#5c5e6a] shrink-0" strokeWidth={1.5} />
        )}
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] leading-none">
          {title}
        </p>
      </div>

      {/* Metric Value */}
      <div className="text-[28px] font-semibold text-[#ececef] font-mono leading-none tracking-tight">
        <AnimatedCounter value={value} format={format} />
      </div>

      {/* Sparkline Graphic */}
      <div className="h-[28px] w-full my-2.5 flex items-center">
        <svg className="w-full h-[28px]" viewBox="0 0 160 28" fill="none" preserveAspectRatio="none">
          <path
            d={generateSparklinePath(value, title)}
            stroke="#7c5cfc"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Trend delta */}
      {trend && (
        <p className={cn("text-[11px] font-mono leading-none mt-1", trendColorClass)}>
          {trend}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {content}
      </Link>
    );
  }
  return content;
}
