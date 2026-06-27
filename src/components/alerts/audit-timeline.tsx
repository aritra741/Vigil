import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/db/schema";

interface AuditTimelineProps {
  entries: AuditLog[];
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No audit entries yet</p>
    );
  }

  return (
    <div className="relative space-y-4 pl-4 border-l border-zinc-800">
      {entries.map((entry, i) => (
        <div key={entry.id} className="relative">
          <span
            className={cn(
              "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950",
              i === 0 ? "bg-violet-500" : "bg-zinc-600"
            )}
          />
          <div>
            <p className="text-sm text-zinc-200">
              <span className="font-medium">{entry.actorName}</span>{" "}
              <span className="text-zinc-400">{entry.action.replace(/_/g, " ")}</span>
            </p>
            {entry.detailsText && (
              <p className="text-xs text-zinc-500 mt-0.5">{entry.detailsText}</p>
            )}
            <p className="text-xs text-zinc-600 mt-1">
              {entry.createdAt ? formatDate(entry.createdAt) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
