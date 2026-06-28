import { NextResponse } from "next/server";
import { getDb, isDbConfigured, rawQuery } from "@/lib/db";
import { alerts, transactions } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    if (!isDbConfigured()) {
      // Return mock historical timeline
      const mockTimeline = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (12 - i) * 7);
        return {
          week: date.toISOString(),
          txCount: Math.floor(3 + Math.random() * 6),
          volume: Math.floor(15000 + Math.random() * 80000),
          flaggedCount: Math.random() > 0.8 ? 1 : 0,
        };
      });
      return NextResponse.json(mockTimeline);
    }

    const db = await getDb();

    // 1. Get sender name for this alert
    const [alertData] = await db
      .select({ senderName: transactions.senderName })
      .from(alerts)
      .innerJoin(transactions, eq(alerts.transactionId, transactions.id))
      .where(and(eq(alerts.id, id), eq(alerts.tenantId, tenantId)))
      .limit(1);

    if (!alertData) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // 2. Query weekly aggregates for the sender
    const query = `
      SELECT
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as "txCount",
        COALESCE(SUM(amount::numeric), 0) as volume,
        SUM(CASE WHEN status IN ('flagged', 'blocked') THEN 1 ELSE 0 END) as "flaggedCount"
      FROM transactions
      WHERE tenant_id = $1
        AND (sender_name = $2 OR receiver_name = $2)
        AND created_at > NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week;
    `;

    const res = await rawQuery(query, [tenantId, alertData.senderName]);

    const formatted = res.rows.map((row: any) => ({
      week: row.week,
      txCount: parseInt(row.txCount || "0", 10),
      volume: parseFloat(row.volume || "0"),
      flaggedCount: parseInt(row.flaggedCount || "0", 10),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Timeline API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load timeline data" },
      { status: 500 }
    );
  }
}
