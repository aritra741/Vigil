import { SURFACE } from "@/lib/design/tokens";

interface TopbarProps {
  tenantName: string;
}

export function Topbar({ tenantName }: TopbarProps) {
  return (
    <header
      className="flex h-11 items-center justify-between px-4"
      style={{
        backgroundColor: SURFACE.page,
        borderBottom: `1px solid ${SURFACE.border}`,
      }}
    >
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{tenantName}</span>
        <div className="h-6 w-6 rounded bg-violet-600/20 flex items-center justify-center text-[10px] font-mono font-medium text-violet-400 border border-violet-500/20">
          AS
        </div>
      </div>
    </header>
  );
}
