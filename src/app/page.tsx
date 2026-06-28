import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowRight,
  Database,
  Cloud,
  Layers,
  Zap,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden selection:bg-violet-500/30 selection:text-violet-200">
      {/* Sleek Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Cyber Glow Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            VIGIL
          </span>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-950/20 text-[10px] py-0 px-2 font-mono">
            v1.0 DSQL-OCC
          </Badge>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Console
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-6 py-16 md:py-24 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          <Badge className="bg-violet-500/10 hover:bg-violet-500/15 text-violet-400 border border-violet-500/20 gap-1.5 py-1 px-3 mb-6 text-xs font-mono">
            <Zap className="h-3 w-3 fill-violet-400" /> Distributed Execution Engine
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
            Real-Time Risk Operations
            <span className="block mt-1 bg-gradient-to-r from-violet-400 via-fuchsia-500 to-red-400 bg-clip-text text-transparent">
              Enforced at the Data Layer
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl">
            Vigil translates risk policies directly into strongly consistent database-enforced transactions. 
            Simulate rule impacts against 50k+ historical operations, track latency profiles, and triage alerts 
            with OCC-safe split-screen environments.
          </p>

          <div className="flex flex-wrap gap-4 mb-14">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/30 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              Enter Command Center
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rules"
              className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-colors border border-zinc-800"
            >
              Configure Policies
            </Link>
          </div>

          {/* Stack Tech Icons */}
          <div className="flex flex-wrap gap-3 mb-16">
            <Badge variant="secondary" className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 gap-1.5 py-1.5 px-3">
              <Layers className="h-3.5 w-3.5" /> Next.js 15
            </Badge>
            <Badge variant="secondary" className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 gap-1.5 py-1.5 px-3">
              <Database className="h-3.5 w-3.5 text-violet-400" /> Aurora DSQL
            </Badge>
            <Badge variant="secondary" className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 gap-1.5 py-1.5 px-3">
              <Cloud className="h-3.5 w-3.5" /> Vercel Edge
            </Badge>
          </div>
        </div>

        {/* Live Aggregation Widget Mockup */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
          {/* Subtle accent border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-violet-500/10 via-violet-500/40 to-transparent" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Transactions Indexed", value: "48,900" },
              { label: "Active Review Cases", value: "12" },
              { label: "DSQL Latency (P99)", value: "31ms" },
              { label: "OCC Conflict Rate", value: "0.0%" },
            ].map((stat) => (
              <div key={stat.label} className="font-mono">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* DSQL Benefits / Features grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "OCC-Safe Updates",
              desc: "Simulate concurrent workflows where Sarah Chen and Marcus Rivera edit alerts simultaneously. DSQL's Optimistic Concurrency Control guards against stale writes.",
              icon: RefreshCw,
              color: "text-amber-400",
            },
            {
              title: "Rule Impact Simulator",
              desc: "Backtest newly composed rules on DSQL. Translate logic to optimized aggregation subqueries to predict alert load before saving to production schemas.",
              icon: Search,
              color: "text-violet-400",
            },
            {
              title: "Velocity Aggregation",
              desc: "Track sender patterns over sliding 1-hour and 24-hour windows. Ingest transaction burst profiles to evaluate volume spikes at the data layer.",
              icon: Database,
              color: "text-red-400",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="rounded-lg border border-zinc-900 bg-zinc-950/40 p-6 hover:border-zinc-800 transition-all group hover:bg-zinc-900/10"
            >
              <div className="h-9 w-9 rounded bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800 group-hover:border-zinc-700">
                <feat.icon className={`h-4.5 w-4.5 ${feat.color}`} />
              </div>
              <h3 className="font-bold text-zinc-100 text-sm mb-2">{feat.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 border-t border-zinc-900/60 text-center text-[10px] font-mono text-zinc-600 mt-12">
        Vigil compliance engine · AWS Aurora DSQL Hackathon Entry · NovaPay Demo Tenant
      </footer>
    </div>
  );
}
