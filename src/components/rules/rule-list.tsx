"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { humanizeRule } from "@/lib/utils/format";
import { toggleRule, deleteRule } from "@/lib/actions/rules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { Rule } from "@/lib/db/schema";

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  high: "bg-amber-500/10 text-amber-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  low: "bg-blue-500/10 text-blue-500",
};

interface RuleWithCount extends Rule {
  alertCount: number;
}

export function RuleList({ rules }: { rules: RuleWithCount[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (rule: RuleWithCount, checked: boolean) => {
    startTransition(async () => {
      const result = await toggleRule(rule.id, checked, rule.version);
      if (result.success) {
        toast.success(`Rule ${checked ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error("Failed to update rule");
      }
    });
  };

  const handleDelete = (ruleId: string) => {
    startTransition(async () => {
      await deleteRule(ruleId);
      toast.success("Rule deleted");
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Name</TableHead>
            <TableHead className="text-zinc-400">Condition</TableHead>
            <TableHead className="text-zinc-400">Severity</TableHead>
            <TableHead className="text-zinc-400">Action</TableHead>
            <TableHead className="text-zinc-400">Active</TableHead>
            <TableHead className="text-zinc-400">Alerts</TableHead>
            <TableHead className="text-zinc-400" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                No rules configured
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id} className="border-zinc-800">
                <TableCell className="font-medium text-zinc-200">{rule.name}</TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {humanizeRule(rule.metric, rule.operator, rule.ruleValue)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("capitalize text-xs", severityStyles[rule.severity])}
                  >
                    {rule.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs border-zinc-700">
                    {rule.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => handleToggle(rule, checked)}
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm text-zinc-400">
                  {rule.alertCount}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                    disabled={isPending}
                    className="text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
