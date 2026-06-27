import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getDashboardMetrics, getOpenAlertCount } from "@/lib/actions/transactions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, openAlertCount] = await Promise.all([
    getDashboardMetrics(),
    getOpenAlertCount(),
  ]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      <Sidebar openAlertCount={openAlertCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center lg:hidden px-3 pt-3">
          <MobileNav openAlertCount={openAlertCount} />
        </div>
        <Topbar tenantName={metrics.tenantName} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
