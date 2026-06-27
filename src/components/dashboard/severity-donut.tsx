"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SeverityBreakdown } from "@/lib/actions/transactions";
import { SEVERITY, SURFACE } from "@/lib/design/tokens";

interface SeverityDonutProps {
  data: SeverityBreakdown[];
}

export function SeverityDonut({ data }: SeverityDonutProps) {
  const chartData = data.map((d) => ({
    name: d.severity,
    value: d.count,
    fill: SEVERITY[d.severity as keyof typeof SEVERITY] ?? "#71717a",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className="rounded-md p-3"
      style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 mb-3">
        Alert Severity
      </p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: "4px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {total}
          </span>
          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.fill }} />
            <span className="text-[10px] text-zinc-500 capitalize">{d.name}</span>
            <span className="text-[10px] font-mono text-zinc-400">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
