"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RiskTrendPoint } from "@/lib/actions/transactions";
import { SURFACE } from "@/lib/design/tokens";

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div
      className="rounded-md p-3"
      style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 mb-3">
        Flagged Transactions · 7d
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#52525b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#222222" }}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            stroke="#52525b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "#71717a" }}
          />
          <Area
            type="monotone"
            dataKey="flagged"
            stroke="#8b5cf6"
            fill="url(#riskGradient)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
