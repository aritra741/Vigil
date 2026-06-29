import { Fragment } from "react";
import Link from "next/link";
import { ThreatCanvasPreview } from "@/components/landing/threat-canvas-preview";

const VALUE_PROPS = [
  {
    title: "Real-time rule evaluation",
    description:
      "Transactions are evaluated against your risk rules as they arrive, including pattern detection across sender history.",
  },
  {
    title: "Investigation workflow",
    description:
      "Triage alerts, escalate cases, and track every analyst action with a complete, immutable audit trail.",
  },
  {
    title: "Backtest before you deploy",
    description:
      "Test new rules against historical transaction data to see their impact before they go live.",
  },
];

const TECH = ["Next.js", "Aurora DSQL", "Vercel", "Drizzle ORM"];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090a] text-[#ececef] selection:bg-[#7c5cfc]/30 selection:text-[#ececef]">
      {/* Subtle ambient glow, restrained not decorative */}
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[rgba(124,92,252,0.10)] blur-[140px]" />

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center px-6 py-5">
        <span className="text-[14px] font-bold uppercase tracking-[0.12em] text-[#ececef]">
          Vigil
        </span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 lg:pt-24">
        {/* Hero: copy on the left, live product preview on the right */}
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-2xl">
            <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#ececef] sm:text-[44px]">
              Risk operations infrastructure for fintechs
            </h1>
            <p className="mt-5 text-[18px] font-normal leading-[1.6] text-[#8b8d98]">
              Monitor transactions against configurable rules. Detect patterns
              across sender history. Investigate alerts with a complete audit
              trail.
            </p>
            <p className="mt-4 text-[14px] leading-[1.5] text-[#5c5e6a]">
              Built for risk and compliance teams at early-stage fintechs and
              marketplace platforms.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#7c5cfc] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#6b4ce6]"
              >
                Enter Command Center
              </Link>
            </div>
          </div>

          {/* Live product preview */}
          <div className="w-full">
            <ThreatCanvasPreview />
          </div>
        </section>

        {/* Value propositions */}
        <section className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              className="border-t border-[rgba(255,255,255,0.08)] pt-5"
            >
              <h2 className="text-[16px] font-semibold text-[#ececef]">
                {v.title}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-[#8b8d98]">
                {v.description}
              </p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="mt-20 border-t border-[rgba(255,255,255,0.08)] pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5c5e6a]">
            How it works
          </p>
          <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-[#8b8d98]">
            Vigil connects to Aurora DSQL for strongly consistent, serverless
            data infrastructure. Deployed on Vercel. Zero infrastructure to
            manage.
          </p>
        </section>

        {/* Tech stack */}
        <section className="mt-20">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[12px] text-[#5c5e6a]">
            {TECH.map((t, i) => (
              <Fragment key={t}>
                {i > 0 && <span className="text-[#3a3b42]">·</span>}
                <span>{t}</span>
              </Fragment>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-[#5c5e6a]">
            Built for H0: Hack the Zero Stack
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-[1200px] border-t border-[rgba(255,255,255,0.06)] px-6 py-6">
        <div className="flex items-center justify-between text-[11px] text-[#5c5e6a]">
          <span>© 2026 Vigil</span>
          <span>H0 Hackathon Submission</span>
        </div>
      </footer>
    </div>
  );
}
