import {
  getRiskTrend,
  getSeverityBreakdown,
  getRecentCriticalAlerts,
  getTopRulesPerformance,
} from "@/lib/actions/transactions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [riskTrend, severity, recentAlerts, rulesPerformance] = await Promise.all([
    getRiskTrend(),
    getSeverityBreakdown(),
    getRecentCriticalAlerts(10), // Fetch 10 alerts for Panel 1 Live Feed
    getTopRulesPerformance(),   // Fetch top 5 rules for Panel 2 Horizontal Bar Chart
  ]);

  return (
    <DashboardClient
      initialRiskTrend={riskTrend}
      initialSeverity={severity}
      initialRecentAlerts={recentAlerts}
      initialRulesPerformance={rulesPerformance}
    />
  );
}
