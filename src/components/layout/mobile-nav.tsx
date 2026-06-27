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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-2" style={{ backgroundColor: "#0a0a0a", borderColor: "#222" }}>
        <nav className="mt-6 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px]",
                  isActive ? "text-white bg-[#1a1a1a]" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500" />
                )}
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {item.href === "/alerts" && openAlertCount > 0 && (
                  <span className="ml-auto text-[10px] font-mono text-red-400">{openAlertCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
