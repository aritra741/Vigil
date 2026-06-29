"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePulse } from "@/components/dashboard/pulse-provider";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { SEVERITY, SEVERITY_MUTED } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Staggered load of client-only simple maps projection component
const ThreatMap = dynamic(
  () => import("./threat-map").then((mod) => mod.ThreatMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#08090a] flex items-center justify-center font-mono text-[10px] text-[#5c5e6a]">
        Initializing Threat Canvas...
      </div>
    ),
  }
);

interface RecentAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date | null;
  amount: string | null;
  currency: string | null;
}

interface DashboardClientProps {
  initialRiskTrend: any[];
  initialSeverity: any[];
  initialRecentAlerts: any[];
  initialRulesPerformance?: any[];
}

function getAlertMeta(title: string, id: string) {
  const isWire = title.toLowerCase().includes("wire");
  const isCrypto = title.toLowerCase().includes("crypto");
  const isSwift = title.toLowerCase().includes("swift");
  
  const rail = isWire ? "Wire" : isCrypto ? "Crypto" : isSwift ? "SWIFT" : "Card";
  
  // Staggered corridor directions
  const routes = ["US → UK", "UK → US", "US → US", "UK → UK"];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const route = routes[hash % routes.length];
  
  return `${rail} · ${route}`;
}

export function DashboardClient({
  initialSeverity,
  initialRecentAlerts,
  initialRulesPerformance,
}: DashboardClientProps) {
  const pulse = usePulse();
  const metrics = pulse ? pulse.metrics : null;
  const [alerts, setAlerts] = useState<RecentAlert[]>(initialRecentAlerts);

  // Monitor pulse for live critical alert arrivals
  useEffect(() => {
    if (pulse?.latestCriticalAlert) {
      const newAlert = pulse.latestCriticalAlert;
      setAlerts((prev) => {
        if (prev.some((a) => a.id === newAlert.id)) return prev;
        const updated = [
          {
            id: newAlert.id,
            title: newAlert.title,
            severity: newAlert.severity,
            status: newAlert.status,
            createdAt: new Date(newAlert.createdAt),
            amount: newAlert.amount,
            currency: newAlert.currency,
          },
          ...prev,
        ];
        return updated.slice(0, 10);
      });
    }
  }, [pulse?.latestCriticalAlert]);

  const currentMetrics = metrics || {
    transactionsToday: 0,
    flaggedCount: 0,
    valueUnderReview: 0,
    openInvestigations: 0,
    avgResolutionHours: 0,
    ruleHitRate: 0,
  };

  // Build HUD metrics lists
  const hudMetrics = useMemo(() => {
    return [
      { label: "Transactions Today", value: currentMetrics.transactionsToday, format: "compact" },
      { label: "Flagged Cases", value: currentMetrics.flaggedCount, format: "number" },
      { label: "Value Under Review", value: currentMetrics.valueUnderReview, format: "currency" },
      { label: "Open Investigations", value: currentMetrics.openInvestigations, format: "number" },
      { label: "Avg Resolution Time", value: currentMetrics.avgResolutionHours, format: "number" },
      { label: "Rule Hit Rate", value: currentMetrics.ruleHitRate, format: "percent" },
    ];
  }, [currentMetrics]);

  // Format Top Rules horizontal bar data
  const rulesPerformance = useMemo(() => {
    return initialRulesPerformance || [
      { name: "High-value transfer", count: 124 },
      { name: "UK-origin review", count: 86 },
      { name: "Crypto rail transfer", count: 48 },
      { name: "Extreme risk score", count: 32 },
      { name: "Rapid-fire sender", count: 19 },
    ];
  }, [initialRulesPerformance]);

  const maxRuleCount = useMemo(() => {
    return Math.max(...rulesPerformance.map((r: any) => r.count), 1);
  }, [rulesPerformance]);

  // Format Donut slices
  const donutOrder = ["critical", "high", "medium", "low"] as const;
  const donutData = useMemo(() => {
    return donutOrder.map((sev) => {
      const found = initialSeverity.find((d) => d.severity.toLowerCase() === sev);
      return {
        name: sev,
        value: found ? found.count : 0,
        fill: SEVERITY[sev],
      };
    });
  }, [initialSeverity]);

  const donutTotal = useMemo(() => {
    return donutData.reduce((sum, d) => sum + d.value, 0);
  }, [donutData]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-2.75rem)] bg-[#08090a] border-t border-[rgba(255,255,255,0.06)] relative -mx-6 -my-6 overflow-hidden">
      
      {/* SECTION 1: HERO ZONE */}
      <div className="relative w-full h-[60vh] select-none bg-[#08090a]">
        
        {/* Minimal live page title */}
        <div className="absolute top-5 left-6 z-10 font-mono">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5c5e6a] leading-none">
            RISK OPERATIONS · LIVE
          </p>
        </div>

        {/* Dynamic World Threat Map */}
        <div className="w-full h-full">
          <ThreatMap />
        </div>

        {/* METRICS HUD OVERLAY */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-[rgba(8,9,10,0.7)] backdrop-blur-[16px] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          {hudMetrics.map((m, idx) => {
            // Pick a deterministic indicator for mock trend arrows
            const isNegative = m.label.includes("Cases") || m.label.includes("Review") || m.label.includes("Open");
            const deltaArrow = isNegative ? "↑" : "↓";
            const deltaColor = isNegative ? "text-[#f5433d]" : "text-[#46b26c]";
            
            return (
              <div
                key={m.label}
                className={cn(
                  "flex-1 flex flex-col justify-center px-6 h-full select-none",
                  idx > 0 && "border-l border-[rgba(255,255,255,0.06)]"
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-1">
                  {m.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-semibold text-[#ececef] font-mono leading-none tracking-tight">
                    <AnimatedCounter value={m.value} format={m.format as any} duration={1200} />
                  </span>
                  <span className={cn("text-[11px] font-mono leading-none", deltaColor)}>
                    {deltaArrow}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: INTEL PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[rgba(255,255,255,0.06)] bg-[#101113] divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.06)]">
        
        {/* Panel 1: Live Alert Feed */}
        <div className="p-5 flex flex-col min-h-[380px] bg-[#101113]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a]">
              ACTIVE THREATS
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5433d] animate-pulse" />
              <span className="text-[10px] font-bold text-[#f5433d] font-mono leading-none">LIVE</span>
            </div>
          </div>

          <div className="flex-1 divide-y divide-[rgba(255,255,255,0.04)] overflow-y-auto max-h-[320px]">
            {alerts.slice(0, 8).map((alert, idx) => {
              const isMostRecent = idx === 0;
              const sevKey = alert.severity as keyof typeof SEVERITY;
              const sevColor = SEVERITY[sevKey] || "#8b8d98";
              const bgWash = isMostRecent 
                ? (SEVERITY_MUTED[sevKey] || "rgba(255,255,255,0.02)") 
                : "transparent";

              return (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.id}`}
                  className="flex items-center justify-between gap-4 py-2.5 px-3 border-l-[3px] hover:bg-[rgba(255,255,255,0.01)] transition-colors cursor-pointer select-none"
                  style={{
                    backgroundColor: bgWash,
                    borderLeftColor: sevColor,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: sevColor }} />
                    <div className="min-w-0 flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2">
                      <span className="font-mono text-[12px] font-semibold text-[#ececef] leading-none shrink-0">
                        {alert.amount && alert.currency ? formatCurrency(alert.amount, alert.currency) : "No amount"}
                      </span>
                      <span className="text-[11px] text-[#5c5e6a] leading-none shrink-0">
                        {getAlertMeta(alert.title, alert.id)}
                      </span>
                      <span className="text-[11px] text-[#8b8d98] truncate leading-none font-sans">
                        {alert.title}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5c5e6a] font-mono shrink-0">
                    {alert.createdAt ? formatRelative(alert.createdAt) : ""}
                  </span>
                </Link>
              );
            })}
            {alerts.length === 0 && (
              <p className="text-center py-8 text-[11px] font-mono text-[#5c5e6a]">No active threats detected.</p>
            )}
          </div>
        </div>

        {/* Panel 2: Rule Performance */}
        <div className="p-5 flex flex-col min-h-[380px] bg-[#101113]">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-4">
            RULE PERFORMANCE
          </p>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {rulesPerformance.map((rule: any) => {
              const percent = (rule.count / maxRuleCount) * 100;
              return (
                <div key={rule.name} className="flex items-center gap-3 text-[11px] font-sans">
                  {/* Label */}
                  <span className="text-[#8b8d98] w-[180px] truncate shrink-0 text-left">
                    {rule.name}
                  </span>

                  {/* Horizontal Bar Track */}
                  <div className="flex-1 h-5 bg-[#18191c] rounded-[2px] overflow-hidden relative border border-[rgba(255,255,255,0.03)]">
                    <div
                      className="h-full bg-[#7c5cfc]/70 rounded-r-[2px] transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Value */}
                  <span className="font-mono text-[#ececef] w-10 text-right shrink-0">
                    {rule.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3: Severity Breakdown */}
        <div className="p-5 flex flex-col min-h-[380px] bg-[#101113]">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-4">
            SEVERITY DISTRIBUTION
          </p>

          <div className="flex-1 flex items-center justify-between gap-6 my-auto">
            
            {/* Centered Donut - 120px diameter, 20px stroke */}
            <div className="relative w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40} // outerRadius 60 - thickness 20 = innerRadius 40
                    outerRadius={60}
                    paddingAngle={0}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[18px] font-semibold text-[#ececef] font-mono leading-none mb-1">
                  {donutTotal}
                </span>
                <span className="text-[9px] text-[#5c5e6a] uppercase tracking-wider font-semibold">
                  TOTAL
                </span>
              </div>
            </div>

            {/* Vertical Legend to the Right */}
            <div className="flex-1 flex flex-col gap-2 font-mono text-[11px]">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-[#8b8d98] capitalize text-[11px] font-sans leading-none">{d.name}</span>
                  </div>
                  <span className="text-[#ececef] font-bold leading-none">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
