"use client";

import dynamic from "next/dynamic";

// Reuse the real dashboard Threat Canvas (globe + flagged-corridor arcs).
// It is self-contained: it fetches /api/heatmap itself and fails gracefully
// to the base map, so it doubles as a live, no-interaction product preview.
// `ssr: false` keeps the client-only map out of the server render, which is
// only permitted inside a Client Component.
const ThreatMap = dynamic(
  () => import("@/components/dashboard/threat-map").then((m) => m.ThreatMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#08090a] font-mono text-[10px] text-[#5c5e6a]">
        Initializing Threat Canvas…
      </div>
    ),
  }
);

const HUD_METRICS = [
  { label: "Transactions", value: "48,900" },
  { label: "Flagged", value: "37" },
  { label: "Under Review", value: "$2.4M" },
];

const FEED = [
  { amount: "$48,500", meta: "Wire · US → UK", time: "2m", color: "#f5433d" },
  { amount: "$12,300", meta: "Card · UK → US", time: "6m", color: "#ee7b30" },
  { amount: "$31,000", meta: "Crypto · US → SG", time: "11m", color: "#e5b847" },
  { amount: "$22,400", meta: "Wire · DE → US", time: "19m", color: "#ee7b30" },
  { amount: "$7,800", meta: "Card · US → US", time: "24m", color: "#46b26c" },
];

export function ThreatCanvasPreview() {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#08090a] shadow-2xl shadow-black/40">
      {/* Subtle accent along the top edge */}
      <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[rgba(124,92,252,0.45)] to-transparent" />

      {/* Window chrome */}
      <div className="flex h-9 items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0b0c0d] px-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f5433d]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5c5e6a]">
            Risk Operations · Live
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.10)]" />
          <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.10)]" />
          <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.10)]" />
        </div>
      </div>

      {/* Body: alert feed pane (left) + threat map pane (right), separated so they never overlap */}
      <div className="flex h-[300px] sm:h-[340px] lg:h-[360px]">
        {/* Alert feed lives in its own pane so it never sits on top of the map */}
        <div className="hidden w-[212px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0c0d0f] p-3 sm:flex">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5c5e6a]">
              Active Threats
            </span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f5433d]" />
              <span className="font-mono text-[9px] font-bold text-[#f5433d]">
                LIVE
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {FEED.map((row) => (
              <div
                key={`${row.amount}-${row.meta}`}
                className="flex items-center justify-between border-l-[2px] py-1 pl-2"
                style={{ borderLeftColor: row.color }}
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-1 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-mono text-[11px] font-semibold leading-none text-[#ececef]">
                    {row.amount}
                  </span>
                  <span className="truncate text-[10px] leading-none text-[#5c5e6a]">
                    {row.meta}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[9px] text-[#5c5e6a]">
                  {row.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat map */}
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0">
            <ThreatMap />
          </div>

          {/* Metrics HUD overlays only the map pane */}
          <div className="absolute inset-x-0 bottom-0 flex h-[64px] items-center border-t border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.72)] backdrop-blur-[16px]">
            {HUD_METRICS.map((m, idx) => (
              <div
                key={m.label}
                className={[
                  "flex h-full flex-1 flex-col justify-center px-4",
                  idx === 0 ? "" : "border-l border-[rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                <span className="mb-1 truncate text-[9px] font-medium uppercase tracking-[0.08em] text-[#5c5e6a]">
                  {m.label}
                </span>
                <span className="font-mono text-[17px] font-semibold leading-none text-[#ececef]">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
