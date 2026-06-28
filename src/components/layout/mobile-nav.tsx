"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  Shield,
  ScrollText,
  FileText,
} from "lucide-react";
import { usePulse } from "@/components/dashboard/pulse-provider";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/rules", label: "Rules", icon: Shield },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: FileText },
];

interface MobileNavProps {
  openAlertCount?: number;
}

export function MobileNav({ openAlertCount = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pulse = usePulse();
  const liveCount = pulse ? pulse.metrics.openInvestigations : openAlertCount;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden text-[#8b8d98] hover:text-[#ececef]" />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-56 p-4 border-r border-[rgba(255,255,255,0.06)]"
        style={{ backgroundColor: "#101113" }} // var(--surface-base)
      >
        {/* Brand eyeball */}
        <div className="pb-3 border-b border-[rgba(255,255,255,0.06)] mb-4">
          <span className="text-[13px] font-bold tracking-[0.12em] text-[#ececef] uppercase">
            VIGIL
          </span>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer",
                  isActive
                    ? "text-[#ececef] bg-[rgba(124,92,252,0.12)]"
                    : "text-[#8b8d98] hover:text-[#ececef] hover:bg-[#18191c]"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#7c5cfc]" />
                )}
                <item.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-[#7c5cfc]" : "text-[#5c5e6a]"
                  )}
                  strokeWidth={1.5}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/alerts" && liveCount > 0 && (
                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(245,67,61,0.10)] text-[#f5433d]">
                    {liveCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
