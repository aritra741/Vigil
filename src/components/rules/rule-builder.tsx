"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createRule } from "@/lib/actions/rules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import {
  RULE_METRICS,
  RULE_OPERATORS,
  SEVERITIES,
  RULE_ACTIONS,
  type RuleMetric,
  type RuleOperator,
  type Severity,
  type RuleAction,
} from "@/types";

export function RuleBuilder() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    metric: "amount" as RuleMetric,
    operator: "greater_than" as RuleOperator,
    ruleValue: "",
    severity: "medium" as Severity,
    action: "flag" as RuleAction,
  });

  const handleBacktest = async () => {
    if (!form.ruleValue) {
      toast.error("Please enter a rule value before backtesting");
      return;
    }
    setIsBacktesting(true);
    setBacktestResult(null);
    try {
      const res = await fetch("/api/rules/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: form.metric,
          operator: form.operator,
          ruleValue: form.ruleValue,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setBacktestResult(data);
        toast.success("Rule backtested successfully");
      }
    } catch {
      toast.error("Failed to run backtest");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createRule(form);
      if (result.success) {
        toast.success(`Rule "${form.name}" created and activated`);
        setOpen(false);
        setBacktestResult(null);
        setForm({
          name: "",
          description: "",
          metric: "amount",
          operator: "greater_than",
          ruleValue: "",
          severity: "medium",
          action: "flag",
        });
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create rule");
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setBacktestResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" />
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Rule
      </DialogTrigger>
      <DialogContent
        className={cn(
          "bg-zinc-900 border-zinc-800 transition-all duration-300",
          backtestResult ? "sm:max-w-3xl" : "sm:max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Create Risk Rule</DialogTitle>
        </DialogHeader>

        <div className={cn("grid gap-6", backtestResult ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {/* Left Panel: Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-zinc-400">Rule Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="High-value wire transfers"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100"
                rows={2}
                placeholder="Escalates wires exceeding rules threshold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Metric</Label>
                <Select
                  value={form.metric}
                  onValueChange={(v) => v && setForm({ ...form, metric: v as RuleMetric })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {RULE_METRICS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize text-zinc-200">
                        {m.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400">Operator</Label>
                <Select
                  value={form.operator}
                  onValueChange={(v) => v && setForm({ ...form, operator: v as RuleOperator })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {RULE_OPERATORS.map((o) => (
                      <SelectItem key={o} value={o} className="capitalize text-zinc-200">
                        {o.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">Rule Value</Label>
              <Input
                required
                value={form.ruleValue}
                onChange={(e) => setForm({ ...form, ruleValue: e.target.value })}
                className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono"
                placeholder="e.g. 10000 or NG,KE"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => v && setForm({ ...form, severity: v as Severity })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize text-zinc-200">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400">Action</Label>
                <Select
                  value={form.action}
                  onValueChange={(v) => v && setForm({ ...form, action: v as RuleAction })}
                >
                  <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {RULE_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a} className="capitalize text-zinc-200">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleBacktest}
                disabled={isBacktesting}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-semibold"
              >
                {isBacktesting ? "Simulating..." : "Backtest Rule"}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                Save & Activate
              </Button>
            </div>
          </form>

          {/* Right Panel: Backtest Simulation Results */}
          {backtestResult && (
            <div className="border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Rule Backtest Simulator
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Evaluated against 30-day historical window
                </p>
              </div>

              <div className="rounded bg-zinc-950 p-3 border border-zinc-800/80 space-y-3 font-mono">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">Matched Tx</span>
                    <span className="text-zinc-200 font-semibold text-sm">
                      {backtestResult.matchedCount} / {backtestResult.totalTransactions} ({backtestResult.matchRate}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase">Matched Volume</span>
                    <span className="text-violet-400 font-bold text-sm">
                      {formatCurrency(backtestResult.matchedVolume, "USD")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-zinc-500 block">Severity Density</span>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-violet-500"
                      style={{ width: `${Math.max(1, Math.min(100, backtestResult.matchRate * 10))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 block">
                    Estimated daily alert load: <span className="text-zinc-200 font-bold">{backtestResult.estimatedDailyAlerts} alerts/day</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Top 5 Historical Matches
                </h4>
                <div className="border border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-[10px] font-mono text-left">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                        <th className="p-1.5">Amount</th>
                        <th className="p-1.5">Sender</th>
                        <th className="p-1.5">Corridor</th>
                        <th className="p-1.5 text-right">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestResult.topMatches.map((m: any, idx: number) => (
                        <tr key={idx} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-950/40">
                          <td className="p-1.5 text-zinc-200 font-semibold">{formatCurrency(m.amount, "USD")}</td>
                          <td className="p-1.5 text-zinc-400 truncate max-w-[65px]">{m.senderName}</td>
                          <td className="p-1.5 text-zinc-500">{m.senderCountry}→{m.receiverCountry}</td>
                          <td className="p-1.5 text-right font-bold text-zinc-300">{parseFloat(m.riskScore).toFixed(2)}</td>
                        </tr>
                      ))}
                      {backtestResult.topMatches.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-zinc-600 font-mono">
                            No matching transactions.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

