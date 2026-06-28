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
      bg: "rgba(139,141,152,0.10)",
      text: "#8b8d98",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-[0.04em] font-mono leading-none select-none",
        className
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
