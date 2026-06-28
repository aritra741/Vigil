import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { eq, and, gte, sql } from "drizzle-orm";
import { getMockTransactions } from "@/lib/demo/mock-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isDbConfigured()) {
      const mockTxs = getMockTransactions();
      const groups: Record<string, { count: number; volume: number }> = {};
      
      mockTxs.forEach((tx) => {
        if (tx.status === "flagged" || tx.status === "blocked") {
          const key = `${tx.senderCountry}-${tx.receiverCountry}`;
          if (!groups[key]) {
            groups[key] = { count: 0, volume: 0 };
          }
          groups[key].count += 1;
          groups[key].volume += tx.amount;
        }
      });
      
      const formatted = Object.entries(groups).map(([key, val]) => {
        const [sender, receiver] = key.split("-");
        return {
          senderCountry: sender,
          receiverCountry: receiver,
          flaggedCount: val.count,
          flaggedVolume: val.volume,
        };
      });
      
      return NextResponse.json(formatted);
    }

    const db = await getDb();
    const tenantId = await getTenantId();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const rows = await db
      .select({
        senderCountry: transactions.senderCountry,
        receiverCountry: transactions.receiverCountry,
        flaggedCount: sql<number>`CAST(COUNT(*) AS integer)`,
        flaggedVolume: sql<number>`CAST(SUM(${transactions.amount}) AS double precision)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          sql`${transactions.status} IN ('flagged', 'blocked')`,
          gte(transactions.createdAt, ninetyDaysAgo),
          // Only cross-border corridors — same-country produces zero-length arcs
          sql`${transactions.senderCountry} != ${transactions.receiverCountry}`
        )
      )
      .groupBy(transactions.senderCountry, transactions.receiverCountry)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(15);

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load heatmap data" },
      { status: 500 }
    );
  }
}
