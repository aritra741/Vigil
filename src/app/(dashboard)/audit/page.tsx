import { listAuditLogs } from "@/lib/actions/audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelative, truncateId } from "@/lib/utils/format";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { rows, total } = await listAuditLogs({ page, pageSize: 50 });
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Complete system of record for all risk operations activity
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Timestamp</TableHead>
              <TableHead className="text-zinc-400">Actor</TableHead>
              <TableHead className="text-zinc-400">Action</TableHead>
              <TableHead className="text-zinc-400">Entity</TableHead>
              <TableHead className="text-zinc-400">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                  No audit entries
                </TableCell>
              </TableRow>
            ) : (
              rows.map((entry) => (
                <TableRow key={entry.id} className="border-zinc-800">
                  <TableCell>
                    <div className="text-sm text-zinc-300">
                      {entry.createdAt ? formatDate(entry.createdAt) : ""}
                    </div>
                    <div className="text-xs text-zinc-600">
                      {entry.createdAt ? formatRelative(entry.createdAt) : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-300">
                    {entry.actorName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-zinc-700 capitalize">
                      {entry.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.entityType === "alert" ? (
                      <Link
                        href={`/alerts/${entry.entityId}`}
                        className="text-sm text-violet-400 hover:underline"
                      >
                        Alert #{truncateId(entry.entityId)}
                      </Link>
                    ) : (
                      <span className="text-sm text-zinc-400 capitalize">
                        {entry.entityType} #{truncateId(entry.entityId)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500 max-w-xs truncate">
                    {entry.detailsText}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/audit?page=${page - 1}`}
              className={cn(buttonVariants({ variant: "outline" }), "border-zinc-800")}
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/audit?page=${page + 1}`}
              className={cn(buttonVariants({ variant: "outline" }), "border-zinc-800")}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
