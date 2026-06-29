import { listTransactions } from "@/lib/actions/transactions";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { rows, total } = await listTransactions({ page, pageSize: 50 });
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <TransactionsClient initialRows={rows} total={total} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/transactions?page=${page - 1}`}
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
              href={`/transactions?page=${page + 1}`}
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
