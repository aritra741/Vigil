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

const opsNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
        "relative flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] transition-colors",
        isActive
          ? "text-white bg-[#1a1a1a]"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-[#141414]"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500" />
      )}
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded text-[10px] font-mono font-medium bg-red-500/15 text-red-400 border border-red-500/25">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ openAlertCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside
      className="hidden lg:flex w-[200px] flex-col shrink-0 py-3 px-2"
      style={{
        backgroundColor: SURFACE.page,
        borderRight: `1px solid ${SURFACE.border}`,
      }}
    >
      <div className="mb-5 px-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-violet-600 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-extrabold text-[15px] tracking-tight text-white">
            Vigil
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5">
        <p className="px-2.5 pb-1 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
          Operations
        </p>
        {opsNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            badge={item.badge ? openAlertCount : undefined}
          />
        ))}

        <div
          className="my-3 mx-2"
          style={{ borderTop: `1px solid ${SURFACE.border}` }}
        />

        <p className="px-2.5 pb-1 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
          Compliance
        </p>
        {configNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>

      <div className="px-2.5 pt-3" style={{ borderTop: `1px solid ${SURFACE.border}` }}>
        <p className="text-[9px] text-zinc-700 uppercase tracking-wider">H0 Hackathon</p>
      </div>
    </aside>
  );
}
