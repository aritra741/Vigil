"use client";

import { useEffect, useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Graticule } from "react-simple-maps";
import { SEVERITY } from "@/lib/design/tokens";

const MAP_W = 800;
const MAP_H = 380;
const MAP_SCALE = 140;

// Pre-verified pixel positions — geoNaturalEarth1, scale=140, translate=[400,190]
const PX: Record<string, [number, number]> = {
  US: [210, 98],  CA: [209, 53],  MX: [188, 132], BR: [291, 225],
  GB: [394, 54],  FR: [404, 76],  DE: [419, 64],  NL: [410, 62],
  SE: [432, 43],  NG: [418, 168], KE: [481, 190], ZA: [447, 265],
  RU: [581, 40],  IN: [565, 139], PK: [541, 115], AE: [512, 132],
  CN: [608, 101], JP: [676, 101], SG: [621, 187], ID: [642, 192],
  VN: [628, 155], AU: [676, 252],
};

const NUM_TO_ISO2: Record<string, string> = {
  "840":"US","124":"CA","484":"MX","076":"BR","76":"BR",
  "826":"GB","250":"FR","276":"DE","528":"NL","752":"SE",
  "566":"NG","404":"KE","710":"ZA","643":"RU","356":"IN",
  "586":"PK","784":"AE","156":"CN","392":"JP","702":"SG",
  "360":"ID","704":"VN","036":"AU","36":"AU",
};

const geoUrl = "/countries-110m.json";

interface Corridor {
  senderCountry: string;
  receiverCountry: string;
  flaggedCount: number;
  flaggedVolume: number;
}

function makeArc(from: [number, number], to: [number, number]): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2;
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const cy = (y1 + y2) / 2 - dist * 0.22;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// Severity tier colors — vivid, high contrast
const TIER_COLORS = {
  critical: "#ff4d4d",   // vivid red
  high:     "#ff9a3c",   // bright amber
  medium:   "#a78bfa",   // violet
  low:      "#38bdf8",   // sky blue
};

export function ThreatMap() {
  const [data, setData] = useState<Corridor[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/heatmap");
        const j = await r.json();
        if (alive && Array.isArray(j)) setData(j);
      } catch {}
    };
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const activeCountries = useMemo(() => {
    const s = new Set<string>();
    data.forEach(c => { s.add(c.senderCountry); s.add(c.receiverCountry); });
    return s;
  }, [data]);

  const arcs = useMemo(() => {
    const valid = data.filter(c =>
      c.senderCountry !== c.receiverCountry &&
      PX[c.senderCountry] && PX[c.receiverCountry]
    );
    if (!valid.length) return [];

    const sorted = [...valid].sort((a, b) => b.flaggedVolume - a.flaggedVolume);
    const maxVol = sorted[0].flaggedVolume;
    const minVol = sorted[sorted.length - 1].flaggedVolume;
    const range = maxVol - minVol || 1;

    return sorted.map((c, i) => {
      const t = (c.flaggedVolume - minVol) / range; // 0=lowest, 1=highest

      const tier =
        t >= 0.75 ? "critical" :
        t >= 0.45 ? "high" :
        t >= 0.2  ? "medium" : "low";

      const color = TIER_COLORS[tier];

      // Core arc width: 1–2.5px. Glow blur width: 6–16px
      const coreWidth  = 0.9 + t * 1.6;
      const glowWidth  = 6 + t * 10;
      const coreOpacity = 0.55 + t * 0.4;
      const glowOpacity = 0.06 + t * 0.14;

      // Dash: top corridors get animated flowing dashes; others get solid
      const animated = t >= 0.45;

      return {
        key: `${c.senderCountry}-${c.receiverCountry}-${i}`,
        d: makeArc(PX[c.senderCountry], PX[c.receiverCountry]),
        color,
        coreWidth,
        glowWidth,
        coreOpacity,
        glowOpacity,
        animated,
        isPrimary: t >= 0.75,
        volume: c.flaggedVolume,
        t,
      };
    });
  }, [data]);

  // Per-country node: color = highest severity of any corridor involving it
  const nodeMap = useMemo(() => {
    const map: Record<string, { color: string; isSender: boolean }> = {};
    arcs.forEach(arc => {
      const senderCountry = data.find(
        d => PX[d.senderCountry] && PX[d.receiverCountry] &&
        makeArc(PX[d.senderCountry], PX[d.receiverCountry]) === arc.d
      )?.senderCountry;
      // Mark sender and receiver
      const [from, to] = arc.d.replace("M ", "").split(" Q ")[0].split(" ");
      // Use arc color for nodes
      Object.entries(PX).forEach(([code, px]) => {
        if (Math.abs(px[0] - parseFloat(from)) < 2 && Math.abs(px[1] - parseFloat(to?.split(" ")[1] || "0")) < 2) {
          if (!map[code] || arc.t > (map[code] as any).t) {
            map[code] = { color: arc.color, isSender: true };
          }
        }
      });
    });
    return map;
  }, [arcs, data]);

  // Active node centers for rendering
  const activeNodes = useMemo(() => {
    const nodes: Array<{ code: string; px: [number, number]; color: string }> = [];
    arcs.forEach(arc => {
      const d = data.find(c =>
        c.senderCountry !== c.receiverCountry &&
        PX[c.senderCountry] && PX[c.receiverCountry] &&
        makeArc(PX[c.senderCountry], PX[c.receiverCountry]) === arc.d
      );
      if (d) {
        [d.senderCountry, d.receiverCountry].forEach(code => {
          if (!nodes.find(n => n.code === code)) {
            nodes.push({ code, px: PX[code], color: arc.color });
          }
        });
      }
    });
    return nodes;
  }, [arcs, data]);

  // Top-3 get animated particles
  const particles = useMemo(() => {
    const top = arcs.filter(a => a.animated).slice(0, 3);
    const out: Array<{ id: string; d: string; dur: number; delay: number; color: string }> = [];
    top.forEach((arc, i) => {
      out.push({ id: `pa-${arc.key}`, d: arc.d, dur: 2.8 + i * 0.5, delay: i * 1.1, color: arc.color });
      if (i < 2 && out.length < 5)
        out.push({ id: `pb-${arc.key}`, d: arc.d, dur: 4 + i * 0.4, delay: 1.5 + i * 0.8, color: arc.color });
    });
    return out.slice(0, 5);
  }, [arcs]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ background: "#08090a" }}>

      {/* Radial atmospheric glow — centers the eye on Europe/Asia corridor */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 58% 38%, rgba(88, 28, 135, 0.18) 0%, rgba(30, 10, 60, 0.08) 50%, transparent 80%)",
        }}
      />

      {/* Geography */}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: MAP_SCALE }}
        width={MAP_W}
        height={MAP_H}
        style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 1 }}
      >
        {/* Latitude/longitude grid — gives it that intelligence-map feel */}
        <Graticule stroke="rgba(139,92,246,0.06)" strokeWidth={0.5} />

        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo, idx) => {
              const code = NUM_TO_ISO2[String(geo.id ?? "")] ?? null;
              const active = code !== null && activeCountries.has(code);
              return (
                <Geography
                  key={geo.id ?? idx}
                  geography={geo}
                  fill={
                    active
                      ? "rgba(109,40,217,0.22)"       // vivid purple for active countries
                      : "rgba(71,85,105,0.18)"         // visible slate for all others
                  }
                  stroke={
                    active
                      ? "rgba(167,139,250,0.6)"        // bright purple border on active
                      : "rgba(100,116,139,0.2)"        // subtle slate border otherwise
                  }
                  strokeWidth={active ? 0.7 : 0.3}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* SVG overlay — arcs, glow, nodes, particles */}
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <defs>
          {/* Heavy glow for arc halos */}
          <filter id="glow-heavy" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Light glow for arc cores */}
          <filter id="glow-light" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Intense glow for nodes */}
          <filter id="glow-node" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Particle glow */}
          <filter id="glow-dot" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Hidden paths for animateMotion */}
          {particles.map(p => (
            <path key={`def-${p.id}`} id={`path-${p.id}`} d={p.d} />
          ))}
        </defs>

        {/* Pass 1: Wide glow halos (rendered first, underneath) */}
        {arcs.map(arc => (
          <path
            key={`glow-${arc.key}`}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.glowWidth}
            strokeLinecap="round"
            opacity={arc.glowOpacity}
            filter="url(#glow-heavy)"
          />
        ))}

        {/* Pass 2: Solid dim base line */}
        {arcs.map(arc => (
          <path
            key={`base-${arc.key}`}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.coreWidth * 2.5}
            strokeLinecap="round"
            opacity={0.12}
          />
        ))}

        {/* Pass 3: Bright glowing core — flowing animated dashes on active, solid on low */}
        {arcs.map(arc => (
          <path
            key={`core-${arc.key}`}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.coreWidth}
            strokeLinecap="round"
            strokeDasharray={arc.animated ? "6 18" : "none"}
            opacity={arc.coreOpacity}
            filter="url(#glow-light)"
          >
            {arc.animated && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-24"
                dur={`${1.2 - arc.t * 0.4}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            )}
            {arc.isPrimary && (
              <animate
                attributeName="opacity"
                values={`${arc.coreOpacity};${Math.min(arc.coreOpacity + 0.25, 1)};${arc.coreOpacity}`}
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </path>
        ))}

        {/* Country endpoint nodes with pulsing rings */}
        {Object.entries(PX).filter(([code]) => activeCountries.has(code)).map(([code, [x, y]], i) => {
          // Find the highest-severity arc involving this country
          const topArc = arcs.find(a => {
            const d = data.find(c =>
              c.senderCountry !== c.receiverCountry &&
              PX[c.senderCountry] && PX[c.receiverCountry] &&
              makeArc(PX[c.senderCountry], PX[c.receiverCountry]) === a.d &&
              (c.senderCountry === code || c.receiverCountry === code)
            );
            return !!d;
          });
          const color = topArc?.color ?? "#a78bfa";

          return (
            <g key={`node-${code}`}>
              {/* Outer expanding pulse ring */}
              <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={1} opacity={0}>
                <animate attributeName="r"       from="4"  to="14" dur={`${2.5 + (i % 3) * 0.4}s`} begin={`${(i * 0.3) % 2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0"  dur={`${2.5 + (i % 3) * 0.4}s`} begin={`${(i * 0.3) % 2}s`} repeatCount="indefinite" />
              </circle>
              {/* Inner solid node */}
              <circle cx={x} cy={y} r={2.5} fill={color} opacity={0.9} filter="url(#glow-node)" />
            </g>
          );
        })}

        {/* Traveling particles along top corridors */}
        {particles.map(p => (
          <circle key={p.id} r={3} fill={p.color} filter="url(#glow-dot)">
            <animateMotion
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath href={`#path-${p.id}`} />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;0;1;1;0"
              keyTimes="0;0.04;0.08;0.92;1"
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
