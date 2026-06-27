"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReport } from "@/lib/actions/reports";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, Copy, Download } from "lucide-react";
import type { Report } from "@/lib/db/schema";

interface ReportsClientProps {
  savedReports: Report[];
}

export function ReportsClient({ savedReports }: ReportsClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [generated, setGenerated] = useState<{
    report: Report;
    severityBreakdown: { severity: string; count: number }[];
    topRules: { name: string; count: number }[];
  } | null>(null);

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(
    format(thirtyDaysAgo, "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(now, "yyyy-MM-dd"));

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateReport({
        dateRangeStart: new Date(startDate),
        dateRangeEnd: new Date(endDate + "T23:59:59"),
      });
      if (result.success && result.report) {
        setGenerated({
          report: result.report,
          severityBreakdown: result.severityBreakdown ?? [],
          topRules: result.topRules ?? [],
        });
        toast.success("Report generated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to generate report");
      }
    });
  };

  const copyReport = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.report.summaryText);
    toast.success("Copied to clipboard");
  };

  const downloadCsv = () => {
    if (!generated) return;
    const csv = [
      "Metric,Value",
      `Total Transactions,${generated.report.totalTransactions}`,
      `Total Flagged,${generated.report.totalFlagged}`,
      `Total Resolved,${generated.report.totalResolved}`,
      ...generated.severityBreakdown.map(
        (s) => `Severity ${s.severity},${s.count}`
      ),
      ...generated.topRules.map((r) => `Rule ${r.name},${r.count}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vigil-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 bg-zinc-950 border-zinc-800"
              />
            </div>
            <div>
              <Label className="text-zinc-400">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-100">{generated.report.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyReport} className="border-zinc-700">
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCsv} className="border-zinc-700">
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-2xl font-bold text-zinc-100">
                  {generated.report.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 uppercase">Transactions</p>
              </div>
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-2xl font-bold text-amber-500">
                  {generated.report.totalFlagged.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 uppercase">Flagged</p>
              </div>
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-2xl font-bold text-green-500">
                  {generated.report.totalResolved.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 uppercase">Resolved</p>
              </div>
            </div>
            <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-mono bg-zinc-950 p-4 rounded-lg">
              {generated.report.summaryText}
            </pre>
          </CardContent>
        </Card>
      )}

      {savedReports.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Saved Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedReports.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0"
              >
                <div>
                  <p className="text-sm text-zinc-200">{r.title}</p>
                  <p className="text-xs text-zinc-500">
                    {r.totalTransactions} txns · {r.totalFlagged} flagged
                  </p>
                </div>
                <p className="text-xs text-zinc-600">
                  {r.createdAt ? format(r.createdAt, "MMM d, yyyy") : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
