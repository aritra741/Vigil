import { cn } from "@/lib/utils";
import { SEVERITY } from "@/lib/design/tokens";

interface RiskPillProps {
  score: string | number;
  className?: string;
}

function riskColor(val: number): string {
  if (val >= 0.85) return SEVERITY.critical;
  if (val >= 0.7) return SEVERITY.high;
  if (val >= 0.4) return SEVERITY.medium;
  return SEVERITY.low;
}

export function RiskPill({ score, className }: RiskPillProps) {
  const val = typeof score === "string" ? parseFloat(score) : score;
  const color = riskColor(val);
  const pct = Math.min(val * 100, 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 w-14 rounded-full overflow-hidden"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[11px] font-mono tabular-nums"
        style={{ color }}
      >
        {val.toFixed(2)}
      </span>
    </div>
  );
}
