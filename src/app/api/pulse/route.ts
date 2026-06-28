import { getDb, isDbConfigured } from "@/lib/db";
import { transactions, alerts } from "@/lib/db/schema";
import { getTenantId } from "@/lib/tenant";
import { eq, and, gte, sql, count, desc, inArray } from "drizzle-orm";
import { getMockTransactions } from "@/lib/demo/mock-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch (e) {
          // Controller might already be closed
        }
      };

      const poll = async () => {
        try {
          if (!isDbConfigured()) {
            const mockTxs = getMockTransactions();
            
            // Calculate aggregates dynamically
            const transactionsToday = 2410 + mockTxs.length;
            const flaggedTxs = mockTxs.filter(t => t.status === "flagged" || t.status === "blocked");
            const flaggedCount = 18 + flaggedTxs.length;
            const valueUnderReview = 284200 + flaggedTxs.reduce((sum, t) => sum + t.amount, 0);
            
            const criticalAlerts = flaggedTxs.filter(t => t.severity === "critical" || t.severity === "high");
            const latestAlert = criticalAlerts[0] || mockTxs[0];

            const mockData = {
              transactionsToday,
              flaggedCount,
              valueUnderReview,
              openInvestigations: 12 + flaggedTxs.filter(t => t.status === "flagged").length,
              avgResolutionHours: 1.8,
              ruleHitRate: transactionsToday > 0 ? (flaggedCount / transactionsToday) * 100 : 0.72,
              latestCriticalAlert: latestAlert ? {
                id: latestAlert.id,
                title: latestAlert.title || `${latestAlert.severity.toUpperCase()}: ${latestAlert.ruleName}`,
                severity: latestAlert.severity,
                status: latestAlert.status,
                createdAt: latestAlert.createdAt.toISOString(),
                amount: latestAlert.amount.toFixed(2),
                currency: "USD",
              } : null,
            };
            sendEvent("pulse", mockData);
            return;
          }

          const db = await getDb();
          const tenantId = await getTenantId();
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          // Get metrics
          const [txToday] = await db
            .select({ count: count() })
            .from(transactions)
            .where(
              and(eq(transactions.tenantId, tenantId), gte(transactions.createdAt, today))
            );

          const [flagged] = await db
            .select({ count: count() })
            .from(transactions)
            .where(
              and(
                eq(transactions.tenantId, tenantId),
                inArray(transactions.status, ["flagged", "blocked"])
              )
            );

          const [underReview] = await db
            .select({ total: sql<string>`SUM(${transactions.amount})` })
            .from(transactions)
            .where(
              and(eq(transactions.tenantId, tenantId), eq(transactions.status, "flagged"))
            );

          const [openAlerts] = await db
            .select({ count: count() })
            .from(alerts)
            .where(
              and(
                eq(alerts.tenantId, tenantId),
                inArray(alerts.status, ["open", "investigating", "escalated"])
              )
            );

          const [resolved] = await db
            .select({
              avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (${alerts.resolvedAt} - ${alerts.createdAt})) * 1000)`,
            })
            .from(alerts)
            .where(
              and(eq(alerts.tenantId, tenantId), eq(alerts.status, "resolved"))
            );

          const [total] = await db
            .select({ count: count() })
            .from(transactions)
            .where(eq(transactions.tenantId, tenantId));

          const [alertCount] = await db
            .select({ count: count() })
            .from(alerts)
            .where(eq(alerts.tenantId, tenantId));

          const totalTx = total?.count ?? 0;
          const totalAlerts = alertCount?.count ?? 0;

          // Latest critical or high alert
          const [latestAlert] = await db
            .select({
              id: alerts.id,
              title: alerts.title,
              severity: alerts.severity,
              status: alerts.status,
              createdAt: alerts.createdAt,
              amount: transactions.amount,
              currency: transactions.currency,
            })
            .from(alerts)
            .innerJoin(transactions, eq(alerts.transactionId, transactions.id))
            .where(
              and(
                eq(alerts.tenantId, tenantId),
                inArray(alerts.severity, ["critical", "high"])
              )
            )
            .orderBy(desc(alerts.createdAt))
            .limit(1);

          const payload = {
            transactionsToday: txToday?.count ?? 0,
            flaggedCount: flagged?.count ?? 0,
            valueUnderReview: parseFloat(underReview?.total || "0"),
            openInvestigations: openAlerts?.count ?? 0,
            avgResolutionHours: resolved?.avgMs ? resolved.avgMs / (1000 * 60 * 60) : 0,
            ruleHitRate: totalTx > 0 ? (totalAlerts / totalTx) * 100 : 0,
            latestCriticalAlert: latestAlert || null,
          };

          sendEvent("pulse", payload);
        } catch (err) {
          console.error("SSE Poll error:", err);
        }
      };

      // Initial poll
      await poll();

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        await poll();
      }, 2000);

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Ignore if already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
