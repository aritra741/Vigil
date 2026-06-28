"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { SURFACE, SEVERITY } from "@/lib/design/tokens";
import { Loader2, Globe } from "lucide-react";

interface CorridorData {
  senderCountry: string;
  receiverCountry: string;
  flaggedCount: number;
  flaggedVolume: number;
}

const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string }> = {
  US: { x: 80, y: 65, name: "United States" },
  BR: { x: 130, y: 145, name: "Brazil" },
  GB: { x: 195, y: 50, name: "United Kingdom" },
  DE: { x: 215, y: 53, name: "Germany" },
  NG: { x: 205, y: 115, name: "Nigeria" },
  KE: { x: 230, y: 125, name: "Kenya" },
  IN: { x: 290, y: 88, name: "India" },
  VN: { x: 325, y: 98, name: "Vietnam" },
};

export function RiskHeatmap() {
  const [data, setData] = useState<CorridorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<{ name: string; count: number; volume: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/heatmap");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to load heatmap data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Refresh every 10 seconds to sync with simulated bursts
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Aggregated data per country (as sender)
  const countryAggregates = data.reduce((acc, curr) => {
    const code = curr.senderCountry;
    if (!acc[code]) {
      acc[code] = { count: 0, volume: 0 };
    }
    acc[code].count += curr.flaggedCount;
    acc[code].volume += curr.flaggedVolume;
    return acc;
  }, {} as Record<string, { count: number; volume: number }>);

  if (loading) {
    return (
      <div
        className="rounded-md p-5 flex flex-col items-center justify-center min-h-[300px]"
        style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
      >
        <Loader2 className="h-6 w-6 text-zinc-600 animate-spin mb-2" />
        <p className="text-xs text-zinc-500 font-mono">Loading global risk map...</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md overflow-hidden grid grid-cols-1 md:grid-cols-3 select-none"
      style={{ backgroundColor: SURFACE.card, border: `1px solid ${SURFACE.border}` }}
    >
      <div className="md:col-span-2 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r" style={{ borderColor: SURFACE.border }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[#7c5cfc]" />
            Global Risk Corridors — Last 7 Days
          </p>
          {hoveredNode && (
            <div className="text-[11px] font-mono px-3 py-1.5 bg-[#1f2023] border border-[rgba(255,255,255,0.09)] text-[#ececef] rounded shrink-0">
              <span className="text-[#7c5cfc] font-bold">{hoveredNode.name}</span>: {hoveredNode.count} cases ({formatCurrency(hoveredNode.volume, "USD")})
            </div>
          )}
        </div>

        <div className="relative w-full aspect-[2/1] bg-transparent overflow-hidden flex items-center justify-center">
          {/* Background Map Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Draw corridor arcs */}
            {data.map((corridor, idx) => {
              const start = COUNTRY_COORDS[corridor.senderCountry];
              const end = COUNTRY_COORDS[corridor.receiverCountry];
              if (!start || !end) return null;

              // Arc path coordinates: control point pulled upwards for curve
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const dr = Math.sqrt(dx * dx + dy * dy);
              // Calculate curved path
              const pathD = `M ${start.x} ${start.y} A ${dr} ${dr} 0 0 1 ${end.x} ${end.y}`;

              return (
                <g key={`corridor-${idx}`}>
                  {/* Glowing line base */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={SEVERITY.high}
                    strokeWidth={1}
                    strokeOpacity={0.15}
                  />
                  {/* Animated dash line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={SEVERITY.critical}
                    strokeWidth={1.2}
                    strokeDasharray="4 8"
                    className="animate-[dash_4s_linear_infinite]"
                    style={{
                      strokeDashoffset: 100,
                    }}
                  />
                </g>
              );
            })}

            {/* Draw country nodes */}
            {Object.entries(COUNTRY_COORDS).map(([code, coords]) => {
              const stats = countryAggregates[code] || { count: 0, volume: 0 };
              const isSender = stats.count > 0;
              
              // Size of circle based on volume
              const radius = isSender ? Math.min(8, 3.5 + Math.log10(stats.volume || 1)) : 3;
              const color = isSender 
                ? (stats.count > 30 ? SEVERITY.critical : stats.count > 15 ? SEVERITY.high : SEVERITY.medium)
                : "#52525b";

              return (
                <g
                  key={`node-${code}`}
                  className="cursor-pointer group"
                  onMouseEnter={() =>
                    setHoveredNode({
                      name: coords.name,
                      count: stats.count,
                      volume: stats.volume,
                    })
                  }
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Transparent hit area to prevent hover boundary jitter */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={16}
                    fill="transparent"
                  />

                  {/* Pulsing ring for high risk senders */}
                  {isSender && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={radius + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      className="animate-ping origin-center"
                      style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: "2s" }}
                      opacity={0.3}
                    />
                  )}
                  {/* Core dot */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius}
                    fill={color}
                    className="transition-transform duration-200 group-hover:scale-125"
                    style={{ transformOrigin: `${coords.x}px ${coords.y}px` }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Corridor listing */}
      <div className="p-5 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a] mb-3">
            Top Risk Corridors
          </p>
          <div className="space-y-2">
            {data.slice(0, 5).map((c, i) => (
              <div
                key={`row-${i}`}
                className="flex items-center justify-between text-[11px] py-1 border-b border-[rgba(255,255,255,0.06)] last:border-0"
              >
                <div className="flex items-center gap-1 font-sans">
                  <span className="font-bold text-[#ececef]">{c.senderCountry}</span>
                  <span className="text-[#5c5e6a]">→</span>
                  <span className="font-bold text-[#8b8d98]">{c.receiverCountry}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[#ececef] font-semibold block">
                    {formatCurrency(c.flaggedVolume, "USD")}
                  </span>
                  <span className="text-[9px] font-mono text-[#5c5e6a]">
                    {c.flaggedCount} cases
                  </span>
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <p className="text-[11px] text-[#5c5e6a] font-mono py-4">No risk corridors in the last 7 days.</p>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#5c5e6a] mt-4 leading-tight font-sans">
          Risk scores and cross-border indicators are evaluated at commit-time directly within Aurora DSQL rulesets.
        </p>
      </div>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
