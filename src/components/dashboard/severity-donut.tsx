"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { SeverityBreakdown } from "@/lib/actions/transactions";
import { SEVERITY, SURFACE } from "@/lib/design/tokens";

interface SeverityDonutProps {
  data: SeverityBreakdown[];
}

export function SeverityDonut({ data }: SeverityDonutProps) {
  // Fixed ordering as per DESIGN.md: critical, high, medium, low
  const order = ["critical", "high", "medium", "low"] as const;
  
  const chartData = order.map((sev) => {
    const found = data.find((d) => d.severity.toLowerCase() === sev);
    return {
      name: sev,
      value: found ? found.count : 0,
      fill: SEVERITY[sev],
    };
  }).filter(d => d.value >= 0); // Keep all to maintain legend structure

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className="rounded-md p-5 select-none"
      style={{
        backgroundColor: SURFACE.card, // var(--surface-base)
        border: `1px solid ${SURFACE.border}`, // var(--border-subtle)
      }}
    >
      {/* Eyebrow Header */}
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-4">
        Alert Severity
      </p>
      
      <div className="flex items-center justify-between gap-6">
        {/* Donut Chart - Max 160px diameter, 24px stroke thickness */}
        <div className="relative w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={56} // Inner 112px diameter
                outerRadius={80} // Outer 160px diameter (24px thickness)
                paddingAngle={0}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[16px] font-semibold text-[#ececef] font-mono tabular-nums leading-none mb-1">
              {total}
            </span>
            <span className="text-[10px] text-[#5c5e6a] uppercase tracking-[0.08em] font-medium leading-none">
              TOTAL
            </span>
          </div>
        </div>
        
        {/* Legend Stacked Vertically to the Right */}
        <div className="flex-1 flex flex-col gap-2 font-mono text-[11px]">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-[#8b8d98] capitalize text-[11px] font-sans leading-none">{d.name}</span>
              </div>
              <span className="text-[#ececef] font-bold leading-none">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
