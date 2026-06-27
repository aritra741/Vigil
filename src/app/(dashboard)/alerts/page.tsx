import { listAlerts } from "@/lib/actions/alerts";
import { AlertQueue } from "@/components/alerts/alert-queue";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { rows, counts } = await listAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Alert Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {counts.all ?? 0} total alerts · triage by status
        </p>
      </div>
      <AlertQueue rows={rows} counts={counts} activeTab="all" />
    </div>
  );
}
