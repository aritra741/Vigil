import { NextResponse } from "next/server";
import { getDb, isDbConfigured, rawQuery } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { metric, operator, ruleValue } = await request.json();

    if (!metric || !operator || ruleValue === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const tenantId = await getTenantId();

    if (!isDbConfigured()) {
      // Mock backtest for demo mode
      const amtVal = parseFloat(ruleValue) || 10000;
      const matched = Math.max(1, Math.floor(100 + Math.random() * 200));
      const total = 48900;
      const vol = matched * (amtVal + Math.random() * 2000);
      return NextResponse.json({
        totalTransactions: total,
        matchedCount: matched,
        matchRate: Math.round((matched / total) * 10000) / 100,
        matchedVolume: vol,
        estimatedDailyAlerts: Math.round((matched / 30) * 10) / 10,
        topMatches: [
          { amount: (amtVal * 1.5).toFixed(2), senderName: "OceanGate Trading", senderCountry: "NG", receiverCountry: "US", riskScore: "0.820", createdAt: new Date().toISOString() },
          { amount: (amtVal * 1.3).toFixed(2), senderName: "Apex Digital LLC", senderCountry: "US", receiverCountry: "GB", riskScore: "0.610", createdAt: new Date(Date.now() - 3600000).toISOString() },
          { amount: (amtVal * 1.2).toFixed(2), senderName: "Vertex Marketplace", senderCountry: "BR", receiverCountry: "US", riskScore: "0.580", createdAt: new Date(Date.now() - 7200000).toISOString() },
          { amount: (amtVal * 1.1).toFixed(2), senderName: "Meridian Trading Co", senderCountry: "US", receiverCountry: "DE", riskScore: "0.440", createdAt: new Date(Date.now() - 10800000).toISOString() },
          { amount: (amtVal * 1.05).toFixed(2), senderName: "PrimeShift Inc", senderCountry: "IN", receiverCountry: "US", riskScore: "0.390", createdAt: new Date(Date.now() - 14400000).toISOString() },
        ],
      });
    }

    // Build SQL condition dynamically
    let conditionSql = "";
    const params: any[] = [tenantId];
    
    // index maps: $1 is tenantId, $2 will be the comparison value if any
    if (metric === "amount") {
      const amt = parseFloat(ruleValue) || 0;
      params.push(amt);
      if (operator === "greater_than") conditionSql = `amount::numeric > $2`;
      else if (operator === "less_than") conditionSql = `amount::numeric < $2`;
      else if (operator === "equals") conditionSql = `amount::numeric = $2`;
      else if (operator === "not_equals") conditionSql = `amount::numeric != $2`;
    } else if (metric === "risk_score") {
      const rs = parseFloat(ruleValue) || 0;
      params.push(rs.toFixed(3));
      if (operator === "greater_than") conditionSql = `risk_score::numeric > $2`;
      else if (operator === "less_than") conditionSql = `risk_score::numeric < $2`;
      else if (operator === "equals") conditionSql = `risk_score::numeric = $2`;
    } else if (metric === "sender_country") {
      if (operator === "equals") {
        conditionSql = `sender_country = $2`;
        params.push(ruleValue);
      } else if (operator === "not_equals") {
        conditionSql = `sender_country != $2`;
        params.push(ruleValue);
      } else if (operator === "in_list") {
        const list = ruleValue.split(",").map((c: string) => c.trim().toUpperCase());
        conditionSql = `sender_country = ANY($2)`;
        params.push(list);
      }
    } else if (metric === "receiver_country") {
      if (operator === "equals") {
        conditionSql = `receiver_country = $2`;
        params.push(ruleValue);
      } else if (operator === "not_equals") {
        conditionSql = `receiver_country != $2`;
        params.push(ruleValue);
      } else if (operator === "in_list") {
        const list = ruleValue.split(",").map((c: string) => c.trim().toUpperCase());
        conditionSql = `receiver_country = ANY($2)`;
        params.push(list);
      }
    } else if (metric === "payment_rail") {
      if (operator === "equals") {
        conditionSql = `payment_rail = $2`;
        params.push(ruleValue);
      } else if (operator === "not_equals") {
        conditionSql = `payment_rail != $2`;
        params.push(ruleValue);
      } else if (operator === "in_list") {
        const list = ruleValue.split(",").map((r: string) => r.trim().toLowerCase());
        conditionSql = `payment_rail = ANY($2)`;
        params.push(list);
      }
    } else if (metric === "country_mismatch") {
      const isMismatch = ruleValue.trim().toLowerCase() === "true";
      conditionSql = isMismatch ? `sender_country != receiver_country` : `sender_country = receiver_country`;
    } else if (metric.startsWith("tx_count_") || metric.startsWith("tx_total_")) {
      const intervalStr = metric.includes("1h") ? "1 hour" : "24 hours";
      const val = parseFloat(ruleValue) || 0;
      params.push(val);
      
      if (metric.startsWith("tx_count_")) {
        conditionSql = `(
          SELECT COUNT(*) FROM transactions t2
          WHERE t2.tenant_id = transactions.tenant_id
            AND t2.sender_name = transactions.sender_name
            AND t2.created_at >= transactions.created_at - INTERVAL '${intervalStr}'
            AND t2.created_at <= transactions.created_at
        ) ${operator === "greater_than" ? ">" : operator === "less_than" ? "<" : "="} $2`;
      } else {
        conditionSql = `(
          SELECT COALESCE(SUM(t2.amount::numeric), 0) FROM transactions t2
          WHERE t2.tenant_id = transactions.tenant_id
            AND t2.sender_name = transactions.sender_name
            AND t2.created_at >= transactions.created_at - INTERVAL '${intervalStr}'
            AND t2.created_at <= transactions.created_at
        ) ${operator === "greater_than" ? ">" : operator === "less_than" ? "<" : "="} $2`;
      }
    }

    if (!conditionSql) {
      return NextResponse.json({ error: "Unsupported metric/operator combination" }, { status: 400 });
    }

    // 1. Get total transaction count in last 30 days
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    `;
    const totalRes = await rawQuery(totalQuery, [tenantId]);
    const totalTransactions = parseInt(totalRes.rows[0]?.count || "0", 10);

    if (totalTransactions === 0) {
      return NextResponse.json({
        totalTransactions: 0,
        matchedCount: 0,
        matchRate: 0,
        matchedVolume: 0,
        estimatedDailyAlerts: 0,
        topMatches: [],
      });
    }

    // 2. Get matched stats
    const statsQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount::numeric), 0) as volume
      FROM transactions
      WHERE tenant_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
        AND (${conditionSql})
    `;
    const statsRes = await rawQuery(statsQuery, params);
    const matchedCount = parseInt(statsRes.rows[0]?.count || "0", 10);
    const matchedVolume = parseFloat(statsRes.rows[0]?.volume || "0");

    // 3. Get top 5 matches
    const topMatchesQuery = `
      SELECT 
        amount, 
        sender_name as "senderName", 
        sender_country as "senderCountry", 
        receiver_country as "receiverCountry", 
        risk_score as "riskScore", 
        created_at as "createdAt"
      FROM transactions
      WHERE tenant_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
        AND (${conditionSql})
      ORDER BY risk_score::numeric DESC
      LIMIT 5
    `;
    const topMatchesRes = await rawQuery(topMatchesQuery, params);

    return NextResponse.json({
      totalTransactions,
      matchedCount,
      matchRate: Math.round((matchedCount / totalTransactions) * 10000) / 100,
      matchedVolume,
      estimatedDailyAlerts: Math.round((matchedCount / 30) * 10) / 10,
      topMatches: topMatchesRes.rows,
    });
  } catch (err) {
    console.error("Backtest API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run backtest" },
      { status: 500 }
    );
  }
}
