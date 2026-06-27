import { notFound } from "next/navigation";
import { getAlertById } from "@/lib/actions/alerts";
import { AlertDetail } from "@/components/alerts/alert-detail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAlertById(id);

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/alerts"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to alerts
      </Link>
      <AlertDetail
        alert={data.alert}
        transaction={data.transaction}
        rule={data.rule}
        similar={data.similar}
        timeline={data.timeline}
        users={data.users}
      />
    </div>
  );
}
