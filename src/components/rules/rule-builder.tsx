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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createRule(form);
      if (result.success) {
        toast.success(`Rule "${form.name}" created`);
        setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-violet-600 hover:bg-violet-700" />
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Rule
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Create Risk Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-zinc-400">Rule Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 bg-zinc-950 border-zinc-800"
              placeholder="High-value transfer"
            />
          </div>
          <div>
            <Label className="text-zinc-400">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 bg-zinc-950 border-zinc-800"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400">Metric</Label>
              <Select
                value={form.metric}
                onValueChange={(v) => v && setForm({ ...form, metric: v as RuleMetric })}
              >
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_METRICS.map((m) => (
                    <SelectItem key={m} value={m}>
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
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_OPERATORS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-zinc-400">Value</Label>
            <Input
              required
              value={form.ruleValue}
              onChange={(e) => setForm({ ...form, ruleValue: e.target.value })}
              className="mt-1 bg-zinc-950 border-zinc-800"
              placeholder="10000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400">Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => v && setForm({ ...form, severity: v as Severity })}
              >
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
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
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a} className="capitalize">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            Save Rule
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
