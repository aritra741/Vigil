import { listReports } from "@/lib/actions/reports";
import { ReportsClient } from "@/components/reports/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const savedReports = await listReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Generate audit-ready risk review reports
        </p>
      </div>
      <ReportsClient savedReports={savedReports} />
    </div>
  );
}
