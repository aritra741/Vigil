import { SURFACE } from "@/lib/design/tokens";

interface TopbarProps {
  tenantName: string;
}

export function Topbar({ tenantName }: TopbarProps) {
  return (
    <header
      className="flex h-11 items-center justify-between px-4 select-none"
      style={{
        backgroundColor: SURFACE.page, // Ground #08090a
        borderBottom: `1px solid ${SURFACE.border}`, // Subtle border
      }}
    >
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-[#8b8d98] uppercase tracking-[0.08em] font-sans">
          {tenantName}
        </span>
        <div className="h-6 w-6 rounded-[4px] bg-[rgba(124,92,252,0.12)] flex items-center justify-center text-[10px] font-mono font-semibold text-[#7c5cfc] border border-[rgba(124,92,252,0.20)]">
          SC
        </div>
      </div>
    </header>
  );
}
