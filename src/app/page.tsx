import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, Database, Cloud, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-zinc-950 to-zinc-950" />

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-16">
          <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Vigil</span>
          <Badge variant="outline" className="ml-2 border-violet-500/30 text-violet-400">
            H0 Hackathon
          </Badge>
        </div>

        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-50 mb-6">
            Financial Risk Operations{" "}
            <span className="text-violet-500">Command Center</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-4">
            Monitor transactions. Trigger rules. Investigate alerts. Audit everything.
          </p>
          <p className="text-zinc-500 mb-10">
            Vigil helps fintechs and marketplace platforms monitor risky transactions,
            trigger configurable review rules, and maintain an audit-ready investigation
            trail — on globally scalable Aurora DSQL infrastructure.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-violet-600 hover:bg-violet-700 text-white"
              )}
            >
              Enter Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-16">
            <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 gap-1.5 py-1.5">
              <Layers className="h-3 w-3" /> Next.js 15
            </Badge>
            <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 gap-1.5 py-1.5">
              <Database className="h-3 w-3" /> Aurora DSQL
            </Badge>
            <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 gap-1.5 py-1.5">
              <Cloud className="h-3 w-3" /> Vercel
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Transactions", value: "48.9K" },
              { label: "Flagged", value: "312" },
              { label: "Under Review", value: "$2.8M" },
              { label: "Open Cases", value: "42" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-500 text-center">
            NovaPay Technologies — Series A fintech demo tenant
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Real-time Monitoring",
              desc: "Ingest transactions with idempotency keys and evaluate against configurable risk rules.",
            },
            {
              title: "Investigation Queue",
              desc: "Triage alerts by severity, assign analysts, and track resolution with OCC-safe updates.",
            },
            {
              title: "Audit-Ready Trail",
              desc: "Every action logged with actor, timestamp, and entity reference for compliance.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <h3 className="font-semibold text-zinc-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
