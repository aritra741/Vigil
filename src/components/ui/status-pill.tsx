import { cn } from "@/lib/utils";
import { TX_STATUS, ALERT_STATUS } from "@/lib/design/tokens";

type PillVariant = "transaction" | "alert";

interface StatusPillProps {
  status: string;
  variant?: PillVariant;
  className?: string;
}

export function StatusPill({ status, variant = "transaction", className }: StatusPillProps) {
  const map = variant === "alert" ? ALERT_STATUS : TX_STATUS;
  const style =
    (map as Record<string, { bg: string; text: string }>)[status] ?? {
      bg: "rgba(161,161,170,0.12)",
      text: "#a1a1aa",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide font-mono",
        className
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
