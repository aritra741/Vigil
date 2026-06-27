import Link from "next/link";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { SEVERITY, SURFACE } from "@/lib/design/tokens";
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

export function RecentAlerts({ alerts }: { alerts: RecentAlert[] }) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: SURFACE.border }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
          Critical & High Alerts
        </p>
      </div>
      <div>
        {alerts.map((alert) => {
          const sevColor = SEVERITY[alert.severity as keyof typeof SEVERITY] ?? "#71717a";
          return (
            <Link
              key={alert.id}
              href={`/alerts/${alert.id}`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a1a] transition-colors border-b last:border-0"
              style={{ borderColor: SURFACE.border, borderLeftWidth: 3, borderLeftColor: sevColor }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-zinc-200 truncate">{alert.title}</p>
                <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
                  {alert.amount && alert.currency
                    ? formatCurrency(alert.amount, alert.currency)
                    : ""}{" "}
                  · {alert.createdAt ? formatRelative(alert.createdAt) : ""}
                </p>
              </div>
              <StatusPill status={alert.status} variant="alert" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
