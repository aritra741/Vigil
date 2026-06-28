"use client";

import { useEffect, useState } from "react";
import { SURFACE } from "@/lib/design/tokens";
import { Zap, ChevronDown, ChevronUp, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryLog {
  query: string;
  duration: number;
  timestamp: number;
}

export function TelemetryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{
    recent: QueryLog[];
    totalQueries: number;
    avgLatency: number;
    occRetries?: number;
  }>({
    recent: [],
    totalQueries: 0,
    avgLatency: 0,
    occRetries: 0,
  });

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch("/api/performance");
        const json = await res.json();
        setData(json);
      } catch (e) {
        // Telemetry is best effort
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  const avgText = data.avgLatency > 0 ? `${data.avgLatency}ms` : "--ms";

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-[10px]">
      {!isOpen ? (
        // Closed state pill
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-full hover:bg-zinc-900 transition-colors shadow-lg hover:border-violet-500/50 cursor-pointer"
        >
          <Zap className="h-3 w-3 text-violet-400 animate-pulse" />
          <span>DSQL: <span className="font-bold text-violet-400">{avgText}</span></span>
        </button>
      ) : (
        // Open panel
        <div
          className="w-72 rounded border shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
          style={{ backgroundColor: SURFACE.card, borderColor: SURFACE.border }}
        >
          {/* Header */}
          <div
            className="px-3 py-2 flex items-center justify-between border-b cursor-pointer hover:bg-zinc-900/50"
            style={{ borderColor: SURFACE.border }}
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-violet-400" />
              <span className="font-bold text-zinc-200">Aurora DSQL Telemetry</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </div>

          {/* Stats Summary */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b" style={{ borderColor: SURFACE.border }}>
            <div className="bg-zinc-950/80 p-2 border border-zinc-900 rounded">
              <span className="text-zinc-500 text-[8px] uppercase block">Avg Query Latency</span>
              <span className="text-zinc-200 text-sm font-semibold">{avgText}</span>
            </div>
            <div className="bg-zinc-950/80 p-2 border border-zinc-900 rounded">
              <span className="text-zinc-500 text-[8px] uppercase block">Total Queries</span>
              <span className="text-zinc-200 text-sm font-semibold">{data.totalQueries}</span>
            </div>
          </div>

          {/* Connection status */}
          <div className="px-3 py-1.5 bg-zinc-950 flex items-center justify-between text-[9px] text-zinc-500 border-b border-zinc-900">
            <span className="flex items-center gap-1">
              <Database className="h-2.5 w-2.5 text-zinc-600" />
              Pool: <span className="text-green-500 font-bold">Active (3/10)</span>
            </span>
            <span>OCC Retries: <span className="text-zinc-400">{data.occRetries ?? 0}</span></span>
          </div>

          {/* Recent Query List */}
          <div className="p-2 space-y-1.5 max-h-36 overflow-y-auto bg-zinc-950/20">
            <p className="text-zinc-600 text-[8px] uppercase tracking-wider px-1">Recent Query Trace</p>
            {data.recent.slice(0, 4).map((trace, idx) => {
              // Extract query command (SELECT, INSERT, etc.)
              const command = trace.query.trim().split(/\s+/)[0]?.toUpperCase() || "QUERY";
              
              // Simplify query output for display
              let queryDisplay = trace.query
                .replace(/\s+/g, " ")
                .replace(/SELECT\s+.*?\s+FROM/i, "SELECT FROM")
                .trim();
              
              if (queryDisplay.length > 50) {
                queryDisplay = queryDisplay.slice(0, 47) + "...";
              }

              return (
                <div
                  key={idx}
                  className="p-1 rounded bg-zinc-950/50 border border-zinc-900/60 flex items-start justify-between gap-1 text-[9px] hover:border-zinc-800 transition-colors"
                >
                  <div className="min-w-0">
                    <span className={cn(
                      "font-bold mr-1",
                      command === "SELECT" ? "text-blue-400" :
                      command === "INSERT" ? "text-green-400" :
                      command === "UPDATE" ? "text-amber-400" : "text-purple-400"
                    )}>
                      {command}
                    </span>
                    <span className="text-zinc-400 text-[9px] break-all">{queryDisplay}</span>
                  </div>
                  <span className="text-violet-400 font-bold shrink-0 font-mono text-[9px]">
                    {Math.round(trace.duration)}ms
                  </span>
                </div>
              );
            })}
            {data.recent.length === 0 && (
              <p className="text-center py-4 text-zinc-600 font-mono text-[9px]">No queries recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
