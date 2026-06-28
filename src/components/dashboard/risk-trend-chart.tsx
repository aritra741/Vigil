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
import { SURFACE, TEXT } from "@/lib/design/tokens";

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
      className="rounded-md p-5 select-none"
      style={{
        backgroundColor: SURFACE.card, // Ground #101113
        border: `1px solid ${SURFACE.border}`, // Subtle border
      }}
    >
      {/* Eyebrow Header */}
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-4">
        Flagged Transactions · 7d
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Solid horizontal grid lines only, opacity 0.5 */}
          <CartesianGrid
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="0"
            opacity={0.5}
            vertical={false}
          />
          
          <XAxis
            dataKey="label"
            stroke="#5c5e6a" // var(--text-tertiary)
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.06)" }}
            fontFamily="var(--font-mono)"
            dy={8}
          />
          
          <YAxis
            stroke="#5c5e6a" // var(--text-tertiary)
            fontSize={10}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
            dx={-8}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: SURFACE.overlay, // #1f2023
              border: `1px solid ${SURFACE.borderDefault}`, // rgba(255,255,255,0.09)
              borderRadius: "4px",
              padding: "8px 12px", // var(--space-2) var(--space-3)
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: TEXT.primary,
            }}
            labelStyle={{ color: TEXT.secondary, marginBottom: "4px" }}
            itemStyle={{ color: "#7c5cfc", padding: 0 }}
            cursor={{ stroke: "rgba(255, 255, 255, 0.14)", strokeWidth: 1 }}
          />
          
          <Area
            type="monotone"
            dataKey="flagged"
            stroke="#7c5cfc" // var(--chart-1)
            strokeWidth={2}
            fill="url(#riskGradient)"
            activeDot={{ r: 4, stroke: "#7c5cfc", strokeWidth: 1.5, fill: "#08090a" }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
