"use client";

import Link from "next/link";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { SEVERITY, SEVERITY_MUTED, SURFACE } from "@/lib/design/tokens";
import { StatusPill } from "@/components/ui/status-pill";

interface RecentAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date | null;
  amount: string | null;
  currency: string | null;
}

function getAlertMeta(title: string, id: string) {
  const isWire = title.toLowerCase().includes("wire");
  const isCrypto = title.toLowerCase().includes("crypto");
  const isSwift = title.toLowerCase().includes("swift");
  
  const rail = isWire ? "Wire" : isCrypto ? "Crypto" : isSwift ? "SWIFT" : "Card";
  
  // Deterministic route based on ID hash
  const routes = ["US → UK", "UK → US", "US → US", "UK → UK"];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const route = routes[hash % routes.length];
  
  return `${rail} · ${route}`;
}

export function RecentAlerts({ alerts }: { alerts: RecentAlert[] }) {
  return (
    <div
      className="rounded-md overflow-hidden select-none"
      style={{
        backgroundColor: SURFACE.card, // Ground #101113
        border: `1px solid ${SURFACE.border}`, // Subtle border
      }}
    >
      {/* Section Header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: SURFACE.border }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a]">
          CRITICAL & HIGH ALERTS
        </p>
        
        {/* Pulsing Dot + LIVE indicator */}
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f5433d] animate-pulse" />
          <span className="text-[10px] font-bold text-[#f5433d] font-mono leading-none">LIVE</span>
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-[rgba(255,255,255,0.06)]">
        {alerts.map((alert, index) => {
          const isMostRecent = index === 0;
          const sevKey = alert.severity as keyof typeof SEVERITY;
          const sevColor = SEVERITY[sevKey] ?? "#8b8d98";
          const sevMutedColor = SEVERITY_MUTED[sevKey] ?? "rgba(255,255,255,0.02)";
          
          // Apply muted background wash for the first item
          const rowBg = isMostRecent ? sevMutedColor : "transparent";
          
          return (
            <Link
              key={alert.id}
              href={`/alerts/${alert.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer border-l-[3px] select-none"
              style={{
                backgroundColor: rowBg,
                borderLeftColor: sevColor,
              }}
            >
              {/* Left Group */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Severity dot */}
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: sevColor }} />
                
                <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  {/* Amount */}
                  <span className="font-mono text-[12px] font-semibold text-[#ececef] leading-none shrink-0">
                    {alert.amount && alert.currency
                      ? formatCurrency(alert.amount, alert.currency)
                      : "No value"}
                  </span>
                  
                  {/* Payment rail + route */}
                  <span className="text-[11px] text-[#5c5e6a] leading-none shrink-0 font-sans">
                    {getAlertMeta(alert.title, alert.id)}
                  </span>
                  
                  {/* Title */}
                  <span className="text-[12px] text-[#8b8d98] truncate leading-none font-sans">
                    {alert.title}
                  </span>
                </div>
              </div>

              {/* Right Group */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusPill status={alert.status} variant="alert" />
                <span className="text-[11px] text-[#5c5e6a] font-mono leading-none shrink-0">
                  {alert.createdAt ? formatRelative(alert.createdAt) : ""}
                </span>
              </div>
            </Link>
          );
        })}
        {alerts.length === 0 && (
          <p className="text-center py-6 text-[12px] font-mono text-[#5c5e6a]">No alerts in feed.</p>
        )}
      </div>
    </div>
  );
}
