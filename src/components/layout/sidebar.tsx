"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  Shield,
  ScrollText,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SURFACE } from "@/lib/design/tokens";
import { usePulse } from "@/components/dashboard/pulse-provider";

const opsNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: true },
];

const configNav = [
  { href: "/rules", label: "Rules", icon: Shield },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: FileText },
];

interface SidebarProps {
  openAlertCount?: number;
}

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-[13px] font-normal transition-colors rounded-[4px] cursor-pointer",
        isActive
          ? "text-[#ececef] bg-[rgba(124,92,252,0.12)]"
          : "text-[#8b8d98] hover:text-[#ececef] hover:bg-[#18191c]"
      )}
    >
      {/* Active Left Indicator Bar positioned at left 0 of the sidebar edge */}
      {isActive && (
        <span className="absolute left-[-12px] top-0 bottom-0 w-[3px] bg-[#7c5cfc]" />
      )}
      
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-[#7c5cfc]" : "text-[#5c5e6a]"
        )}
        strokeWidth={1.5}
      />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(245,67,61,0.10)] text-[#f5433d]">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ openAlertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const pulse = usePulse();

  const liveCount = pulse ? pulse.metrics.openInvestigations : openAlertCount;

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside
      className="hidden lg:flex w-[220px] flex-col shrink-0 py-4 px-3 select-none"
      style={{
        backgroundColor: SURFACE.card, // var(--surface-base)
        borderRight: `1px solid ${SURFACE.border}`, // var(--border-subtle)
      }}
    >
      {/* Brand Header */}
      <div className="pb-4 mb-4 border-b border-[rgba(255,255,255,0.06)] px-3">
        <Link
          href="/"
          className="text-[13px] font-bold tracking-[0.12em] text-[#ececef] uppercase font-sans hover:opacity-90 block"
        >
          VIGIL
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {/* Operations Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-2">
            OPERATIONS
          </p>
          <div className="space-y-0.5">
            {opsNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                badge={item.badge ? liveCount : undefined}
              />
            ))}
          </div>
        </div>

        {/* Compliance Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-2">
            COMPLIANCE
          </p>
          <div className="space-y-0.5">
            {configNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Tenant Indicator at the Bottom */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] px-3 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-[#7c5cfc] flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-[#08090a]">N</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#5c5e6a] truncate font-sans">
            NovaPay Engine
          </p>
        </div>
      </div>
    </aside>
  );
}
