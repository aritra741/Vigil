"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatRelative, countryFlag } from "@/lib/utils/format";
import { SEVERITY, SURFACE } from "@/lib/design/tokens";
import { StatusPill } from "@/components/ui/status-pill";

interface AlertRow {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date | null;
  assignedTo: string | null;
  ruleName: string;
  amount: string | null;
  currency: string | null;
  senderCountry: string | null;
  receiverCountry: string | null;
}

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

interface AlertQueueProps {
  rows: AlertRow[];
  counts: Record<string, number>;
  activeTab: string;
}

function AlertList({ rows }: { rows: AlertRow[] }) {
  return (
    <div>
      {rows.map((alert, i) => {
        const sevColor = SEVERITY[alert.severity as keyof typeof SEVERITY] ?? "#71717a";
        return (
          <Link
            key={alert.id}
            href={`/alerts/${alert.id}`}
            className="flex items-center gap-3 px-3 h-10 hover:bg-[#1a1a1a] transition-colors"
            style={{
              backgroundColor: i % 2 === 0 ? SURFACE.card : SURFACE.rowAlt,
              borderBottom: `1px solid ${SURFACE.border}`,
              borderLeft: `3px solid ${sevColor}`,
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-zinc-200 truncate">{alert.title}</p>
              <p className="text-[10px] font-mono text-zinc-600 truncate">
                {alert.amount && alert.currency
                  ? formatCurrency(alert.amount, alert.currency)
                  : ""}{" "}
                · {countryFlag(alert.senderCountry ?? "")}→{countryFlag(alert.receiverCountry ?? "")}{" "}
                · {alert.ruleName}
              </p>
            </div>
            <StatusPill status={alert.status} variant="alert" />
            <span className="text-[10px] font-mono text-zinc-600 w-16 text-right shrink-0">
              {alert.createdAt ? formatRelative(alert.createdAt) : ""}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function AlertQueue({ rows, counts, activeTab }: AlertQueueProps) {
  return (
    <Tabs defaultValue={activeTab} className="w-full">
      <TabsList
        className="h-8 p-0.5 rounded-md gap-0"
        style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
      >
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-7 px-2.5 text-[11px] rounded data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-zinc-200 text-zinc-600"
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-[10px] text-zinc-600">
              {counts[tab.value] ?? 0}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-2">
          <div
            className="rounded-md overflow-hidden"
            style={{ border: `1px solid ${SURFACE.border}` }}
          >
            <AlertList
              rows={
                tab.value === "all"
                  ? rows
                  : rows.filter((r) => r.status === tab.value)
              }
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
