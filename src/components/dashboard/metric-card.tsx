"use client";

import Link from "next/link";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "@/lib/utils";
import { METRIC_BORDER, type MetricBorder, SURFACE } from "@/lib/design/tokens";
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
  borderColor?: MetricBorder;
  iconName?: keyof typeof ICONS;
  trend?: string;
}

export function MetricCard({
  title,
  value,
  format = "number",
  href,
  borderColor = "default",
  iconName,
  trend,
}: MetricCardProps) {
  const Icon = iconName ? ICONS[iconName] : null;
  const accent = METRIC_BORDER[borderColor];

  const content = (
    <div
      className="relative rounded-md overflow-hidden transition-colors hover:bg-[#1a1a1a]"
      style={{
        backgroundColor: SURFACE.card,
        border: `1px solid ${SURFACE.border}`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 leading-none">
            {title}
          </p>
          {Icon && (
            <Icon className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.5} />
          )}
        </div>
        <div className="text-[28px] font-semibold text-white font-mono tabular-nums leading-tight">
          <AnimatedCounter value={value} format={format} />
        </div>
        {trend && (
          <p className="text-[10px] text-zinc-600 mt-1 font-mono">{trend}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
