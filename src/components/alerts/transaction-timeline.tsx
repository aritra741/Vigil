"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { SURFACE, SEVERITY } from "@/lib/design/tokens";
import { Loader2, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";

interface TimelinePoint {
  week: string;
  txCount: number;
  volume: number;
  flaggedCount: number;
}

export function TransactionTimeline({ alertId, senderName }: { alertId: string; senderName: string }) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/alerts/${alertId}/timeline`);
        const json = await res.json();
        if (!json.error) {
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load timeline", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [alertId]);

  if (loading) {
    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col items-center justify-center min-h-[150px]">
        <Loader2 className="h-5 w-5 text-zinc-600 animate-spin mb-1.5" />
        <p className="text-[10px] font-mono text-zinc-500">Loading sender timeline...</p>
      </div>
    );
  }

  const totalVolume = data.reduce((sum, p) => sum + p.volume, 0);
  const totalTx = data.reduce((sum, p) => sum + p.txCount, 0);
  const totalFlagged = data.reduce((sum, p) => sum + p.flaggedCount, 0);
  const flaggedRate = totalTx > 0 ? (totalFlagged / totalTx) * 100 : 0;

  // Render SVG properties
  const svgWidth = 500;
  const svgHeight = 70;
  const paddingX = 30;
  const paddingY = 15;

  const pointsCount = data.length;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Max volume for scaling
  const maxVolume = Math.max(...data.map((p) => p.volume), 1000);

  const svgPoints = data.map((p, i) => {
    const x = paddingX + (i * chartWidth) / (pointsCount - 1 || 1);
    // Scale y coordinates: higher volume means smaller y (drawn from top)
    const y = paddingY + chartHeight - (p.volume * chartHeight) / maxVolume;
    return { ...p, x, y };
  });

  // Polyline points string
  const polylinePoints = svgPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Warning assessment
  const hasRecentAlerts = data.slice(-3).some((p) => p.flaggedCount > 0);

  return (
    <div
      className="rounded-md p-3.5"
      style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-violet-500" strokeWidth={1.5} />
            Forensic Activity Timeline · {senderName}
          </p>
          <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
            Weekly transaction velocity (90 days history)
          </p>
        </div>

        {hoveredPoint && (
          <div className="text-[9px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded">
            Week: <span className="text-zinc-400 font-bold">{new Date(hoveredPoint.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span> | Volume:{" "}
            <span className="text-violet-400">{formatCurrency(hoveredPoint.volume, "USD")}</span> | {hoveredPoint.flaggedCount} flagged
          </div>
        )}
      </div>

      {/* SVG Timeline Chart */}
      <div className="w-full bg-zinc-950/40 rounded border border-zinc-900/60 p-1 mb-3.5">
        <svg className="w-full h-auto" viewBox={`0 0 ${svgWidth} ${svgHeight}`} fill="none">
          {/* Baseline */}
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="#222"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Area fill under the line */}
          {svgPoints.length > 1 && (
            <path
              d={`M ${svgPoints[0].x} ${svgHeight - paddingY} ${svgPoints
                .map((p) => `L ${p.x} ${p.y}`)
                .join(" ")} L ${svgPoints[svgPoints.length - 1].x} ${svgHeight - paddingY} Z`}
              fill="url(#timelineGradient)"
              opacity={0.06}
            />
          )}

          <defs>
            <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Connected Polyline */}
          <polyline
            points={polylinePoints}
            stroke="#444"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive nodes */}
          {svgPoints.map((p, i) => {
            const isFlagged = p.flaggedCount > 0;
            const nodeColor = isFlagged ? SEVERITY.critical : "#52525b";
            const nodeRadius = isFlagged ? 4 : 2.5;

            return (
              <g
                key={`node-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={10}
                  fill="transparent"
                />
                {/* Glowing outline for flagged weeks */}
                {isFlagged && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={8}
                    fill="none"
                    stroke={SEVERITY.critical}
                    strokeWidth={1}
                    className="animate-ping"
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                    opacity={0.25}
                    pointerEvents="none"
                  />
                )}
                {/* Core node circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={nodeRadius}
                  fill={nodeColor}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Timeline stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono pt-1">
        <div>
          <span className="text-zinc-600 block text-[9px] uppercase tracking-wider">Total Txs</span>
          <span className="text-zinc-300 font-bold">{totalTx} transactions</span>
        </div>
        <div>
          <span className="text-zinc-600 block text-[9px] uppercase tracking-wider">Total Volume</span>
          <span className="text-zinc-300 font-bold">{formatCurrency(totalVolume, "USD")}</span>
        </div>
        <div>
          <span className="text-zinc-600 block text-[9px] uppercase tracking-wider">Flagged Volume</span>
          <span className="text-zinc-300 font-bold">{totalFlagged} cases</span>
        </div>
        <div>
          <span className="text-zinc-600 block text-[9px] uppercase tracking-wider">Risk Profile</span>
          <span
            className={`font-bold flex items-center gap-1 ${
              flaggedRate > 15 ? "text-red-400" : flaggedRate > 0 ? "text-amber-400" : "text-green-400"
            }`}
          >
            {flaggedRate > 15 ? (
              <>
                <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                HIGH RISK
              </>
            ) : flaggedRate > 0 ? (
              <>
                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                ELEVATED
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-green-400 shrink-0" />
                CLEAN
              </>
            )}
          </span>
        </div>
      </div>

      {/* Advisory notice */}
      {hasRecentAlerts && (
        <div className="mt-3 p-2 bg-red-950/15 border border-red-500/20 text-red-400 text-[10px] font-mono leading-tight flex items-start gap-1.5 rounded">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <span>
            <strong>Velocity Alert:</strong> Recent transaction activity shows recurring flags. Sender behavior resembles structuring pattern or rapid retry alerts.
          </span>
        </div>
      )}
    </div>
  );
}
