import {
  getDashboardMetrics,
  getRiskTrend,
  getSeverityBreakdown,
  getRecentCriticalAlerts,
} from "@/lib/actions/transactions";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { SeverityDonut } from "@/components/dashboard/severity-donut";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { DEMO_TRENDS } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, riskTrend, severity, recentAlerts] = await Promise.all([
    getDashboardMetrics(),
    getRiskTrend(),
    getSeverityBreakdown(),
    getRecentCriticalAlerts(5),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Command Center</h1>
        <p className="text-[11px] text-zinc-600 mt-0.5 uppercase tracking-wider">
          Risk operations · live
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        <MetricCard
          title="Transactions Today"
          value={metrics.transactionsToday}
          format="compact"
          href="/transactions"
          iconName="credit-card"
          borderColor="default"
          trend={DEMO_TRENDS.transactionsToday}
        />
        <MetricCard
          title="Flagged"
          value={metrics.flaggedCount}
          format="number"
          href="/transactions"
          borderColor="critical"
          iconName="alert-triangle"
          trend={DEMO_TRENDS.flaggedCount}
        />
        <MetricCard
          title="Value Under Review"
          value={metrics.valueUnderReview}
          format="currency"
          href="/transactions"
          borderColor="high"
          iconName="dollar-sign"
          trend={DEMO_TRENDS.valueUnderReview}
        />
        <MetricCard
          title="Open Investigations"
          value={metrics.openInvestigations}
          format="number"
          href="/alerts"
          borderColor="medium"
          iconName="search"
          trend={DEMO_TRENDS.openInvestigations}
        />
        <MetricCard
          title="Avg Resolution"
          value={metrics.avgResolutionHours}
          format="number"
          borderColor="low"
          iconName="clock"
          trend={DEMO_TRENDS.avgResolutionHours}
        />
        <MetricCard
          title="Rule Hit Rate"
          value={metrics.ruleHitRate}
          format="percent"
          borderColor="neutral"
          iconName="percent"
          trend={DEMO_TRENDS.ruleHitRate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <RiskTrendChart data={riskTrend} />
        <SeverityDonut data={severity} />
      </div>

      <RecentAlerts alerts={recentAlerts} />
    </div>
  );
}
