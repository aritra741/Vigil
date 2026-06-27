"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditTimeline } from "./audit-timeline";
import {
  formatCurrency,
  formatDate,
  countryFlag,
  humanizeRule,
} from "@/lib/utils/format";
import { updateAlertStatus } from "@/lib/actions/alerts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Alert, Transaction, Rule, TenantUser, AuditLog } from "@/lib/db/schema";
import { ALERT_STATUSES, type AlertStatus } from "@/types";

const severityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
  high: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

interface AlertDetailProps {
  alert: Alert;
  transaction: Transaction;
  rule: Rule;
  similar: Transaction[];
  timeline: AuditLog[];
  users: TenantUser[];
}

export function AlertDetail({
  alert,
  transaction,
  rule,
  similar,
  timeline,
  users,
}: AlertDetailProps) {
  const [status, setStatus] = useState(alert.status);
  const [assignedTo, setAssignedTo] = useState(alert.assignedTo ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleUpdate = () => {
    startTransition(async () => {
      const result = await updateAlertStatus(
        alert.id,
        status as AlertStatus,
        alert.version,
        assignedTo || null
      );
      if (result.success) {
        toast.success(`Alert ${status.replace("_", " ")} successfully`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Update failed");
        router.refresh();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className={cn("capitalize", severityStyles[alert.severity])}
            >
              {alert.severity}
            </Badge>
            <Badge variant="outline" className="capitalize border-zinc-700">
              {alert.status.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">{alert.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Created {alert.createdAt ? formatDate(alert.createdAt) : ""}
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase">Amount</p>
              <p className="font-mono text-lg text-zinc-100">
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Risk Score</p>
              <p className="font-mono text-lg text-zinc-100">{transaction.riskScore}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Sender</p>
              <p className="text-zinc-200">{transaction.senderName}</p>
              <p className="text-zinc-500">
                {countryFlag(transaction.senderCountry)} {transaction.senderCountry}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Receiver</p>
              <p className="text-zinc-200">{transaction.receiverName}</p>
              <p className="text-zinc-500">
                {countryFlag(transaction.receiverCountry)} {transaction.receiverCountry}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Payment Rail</p>
              <p className="text-zinc-200 capitalize">{transaction.paymentRail}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Status</p>
              <p className="text-zinc-200 capitalize">{transaction.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Rule Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-zinc-200">{rule.name}</p>
            <p className="text-sm text-zinc-400 mt-1">
              {humanizeRule(rule.metric, rule.operator, rule.ruleValue)}
            </p>
            <p className="text-sm text-zinc-500 mt-2">{alert.explanation}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Similar Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {similar.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between text-sm py-2 border-b border-zinc-800 last:border-0"
              >
                <span className="text-zinc-300">
                  {formatCurrency(tx.amount, tx.currency)}
                </span>
                <span className="text-zinc-500 capitalize">{tx.status}</span>
                <span className="text-zinc-600 text-xs">
                  {tx.createdAt ? formatDate(tx.createdAt) : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase">Status</label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase">Assign To</label>
              <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? "")}>
                <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isPending}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Update Alert
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Audit Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline entries={timeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
