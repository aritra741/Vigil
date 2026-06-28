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
import { TransactionTimeline } from "./transaction-timeline";
import {
  formatCurrency,
  formatDate,
  countryFlag,
  humanizeRule,
} from "@/lib/utils/format";
import { updateAlertStatus } from "@/lib/actions/alerts";
import {
  OCC_CONFLICT_CODE,
  VERSION_CONFLICT_CODE,
} from "@/lib/utils/db-errors";
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

  // Concurrency Simulation States
  const [isConcurrentMode, setIsConcurrentMode] = useState(false);
  const [sarahStatus, setSarahStatus] = useState(alert.status);
  const [sarahAssigned, setSarahAssigned] = useState(alert.assignedTo ?? "");
  const [sarahVersion, setSarahVersion] = useState(alert.version);
  const [sarahPending, setSarahPending] = useState(false);
  const [sarahMessage, setSarahMessage] = useState<{
    type: "success" | "error" | "conflict" | "retry";
    text: string;
  } | null>(null);

  const [marcusStatus, setMarcusStatus] = useState(alert.status);
  const [marcusAssigned, setMarcusAssigned] = useState(alert.assignedTo ?? "");
  const [marcusVersion, setMarcusVersion] = useState(alert.version);
  const [marcusPending, setMarcusPending] = useState(false);
  const [marcusMessage, setMarcusMessage] = useState<{
    type: "success" | "error" | "conflict" | "retry";
    text: string;
  } | null>(null);

  const handleConflictResult = (
    result: { error?: string; code?: string },
    version: number,
    setMessage: (msg: { type: "success" | "error" | "conflict" | "retry"; text: string } | null) => void,
    analystLabel?: string
  ) => {
    if (result.code === OCC_CONFLICT_CODE) {
      setMessage({
        type: "retry",
        text: "SQLSTATE 40001 — serializable conflict. DSQL aborted the write; please retry.",
      });
      toast.error(`${analystLabel ?? "Update"}: conflict (40001) — retry required`);
      return;
    }

    if (
      result.code === VERSION_CONFLICT_CODE ||
      result.error?.includes("Concurrent") ||
      result.error?.toLowerCase().includes("version") ||
      result.error?.toLowerCase().includes("conflict")
    ) {
      setMessage({
        type: "conflict",
        text: `OCC mismatch — submitted v${version}, but another analyst updated first.`,
      });
      return;
    }

    setMessage({ type: "error", text: result.error || "Update failed" });
  };

  // Keep concurrency states in sync with DB updates
  const syncStates = () => {
    setSarahStatus(alert.status);
    setSarahAssigned(alert.assignedTo ?? "");
    setSarahVersion(alert.version);
    setSarahMessage(null);

    setMarcusStatus(alert.status);
    setMarcusAssigned(alert.assignedTo ?? "");
    setMarcusVersion(alert.version);
    setMarcusMessage(null);
  };

  const handleUpdate = () => {
    startTransition(async () => {
      const result = await updateAlertStatus(
        alert.id,
        status as AlertStatus,
        alert.version,
        assignedTo || null
      );
      if (result.success && result.alert) {
        toast.success(`Alert updated successfully to version ${result.alert.version}`);
        router.refresh();
      } else if (result.code === OCC_CONFLICT_CODE) {
        toast.error("SQLSTATE 40001 — please retry your update");
      } else if (result.code === VERSION_CONFLICT_CODE) {
        toast.error("Version conflict — refresh and try again");
        router.refresh();
      } else {
        toast.error(result.error ?? "Update failed");
        router.refresh();
      }
    });
  };

  const handleSarahUpdate = async () => {
    setSarahPending(true);
    setSarahMessage(null);
    try {
      const result = await updateAlertStatus(
        alert.id,
        sarahStatus as AlertStatus,
        sarahVersion,
        sarahAssigned || null,
        "Sarah Chen"
      );
      if (result.success && result.alert) {
        setSarahMessage({
          type: "success",
          text: `Saved! Version ${sarahVersion} ➔ ${result.alert.version}`,
        });
        setSarahVersion(result.alert.version);
        toast.success("Sarah Chen: Alert escalated successfully");
        router.refresh();
      } else {
        handleConflictResult(result, sarahVersion, setSarahMessage, "Sarah Chen");
      }
    } catch (e: any) {
      setSarahMessage({ type: "error", text: e.message || "Failed" });
    } finally {
      setSarahPending(false);
    }
  };

  const handleMarcusUpdate = async () => {
    setMarcusPending(true);
    setMarcusMessage(null);
    try {
      const result = await updateAlertStatus(
        alert.id,
        marcusStatus as AlertStatus,
        marcusVersion,
        marcusAssigned || null,
        "Marcus Rivera"
      );
      if (result.success && result.alert) {
        setMarcusMessage({
          type: "success",
          text: `Saved! Version ${marcusVersion} ➔ ${result.alert.version}`,
        });
        setMarcusVersion(result.alert.version);
        toast.success("Marcus Rivera: Alert resolved successfully");
        router.refresh();
      } else {
        if (result.code === VERSION_CONFLICT_CODE) {
          setMarcusMessage({
            type: "conflict",
            text: `OCC mismatch! Marcus submitted v${marcusVersion}, but database is at v${alert.version + 1}.`,
          });
          setTimeout(() => {
            setMarcusMessage({
              type: "error",
              text: "Conflict detected: Auto-merging updates and syncing...",
            });
            setTimeout(() => {
              router.refresh();
              setMarcusVersion(alert.version + 1);
            }, 1500);
          }, 3500);
        } else {
          handleConflictResult(result, marcusVersion, setMarcusMessage, "Marcus Rivera");
        }
      }
    } catch (e: any) {
      setMarcusMessage({ type: "error", text: e.message || "Failed" });
    } finally {
      setMarcusPending(false);
    }
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
            <Badge variant="outline" className="capitalize border-zinc-700 font-mono">
              Status: {alert.status.replace("_", " ")} (v{alert.version})
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">{alert.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Created {alert.createdAt ? formatDate(alert.createdAt) : ""}
          </p>
        </div>

        <TransactionTimeline alertId={alert.id} senderName={transaction.senderName} />

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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-zinc-300">Actions</CardTitle>
            <Button
              size="xs"
              variant={isConcurrentMode ? "default" : "outline"}
              className={cn(
                "font-mono text-[9px] px-2 py-0.5",
                isConcurrentMode
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border-zinc-800"
              )}
              onClick={() => {
                setIsConcurrentMode(!isConcurrentMode);
                syncStates();
              }}
            >
              {isConcurrentMode ? "Exit Concurrency Demo" : "Simulate Concurrency"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isConcurrentMode ? (
              // Normal Single Analyst Mode
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Status</label>
                  <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                    <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {ALERT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize text-zinc-200">
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Assign To</label>
                  <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? "")}>
                    <SelectTrigger className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-zinc-200">
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={isPending}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                >
                  Update Alert (v{alert.version})
                </Button>
              </div>
            ) : (
              // Split-screen OCC Demo Mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                {/* Panel 1: Sarah Chen */}
                <div className="border border-zinc-800 p-2.5 rounded bg-zinc-950/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="font-bold text-violet-400">Sarah Chen (Analyst A)</span>
                    <span className="text-[9px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-400">
                      v{sarahVersion}
                    </span>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[10px]">STATUS</label>
                    <Select value={sarahStatus} onValueChange={(v) => v && setSarahStatus(v)}>
                      <SelectTrigger className="h-8 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        {ALERT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-zinc-200 text-[11px]">
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSarahUpdate}
                    disabled={sarahPending}
                    className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[11px]"
                  >
                    {sarahPending ? "Saving..." : "Escalate"}
                  </Button>

                  {sarahMessage && (
                    <div
                      className={cn(
                        "p-2 rounded text-[10px] leading-tight",
                        sarahMessage.type === "success"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : sarahMessage.type === "retry"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold"
                            : sarahMessage.type === "conflict"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}
                    >
                      {sarahMessage.text}
                    </div>
                  )}
                </div>

                {/* Panel 2: Marcus Rivera */}
                <div
                  className={cn(
                    "border p-2.5 rounded bg-zinc-950/60 space-y-3 transition-colors",
                    marcusMessage?.type === "conflict"
                      ? "border-red-500/50 bg-red-950/10"
                      : "border-zinc-800"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="font-bold text-amber-500">Marcus R. (Analyst B)</span>
                    <span className="text-[9px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-400">
                      v{marcusVersion}
                    </span>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[10px]">STATUS</label>
                    <Select value={marcusStatus} onValueChange={(v) => v && setMarcusStatus(v)}>
                      <SelectTrigger className="h-8 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        {ALERT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-zinc-200 text-[11px]">
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleMarcusUpdate}
                    disabled={marcusPending}
                    className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-semibold text-[11px]"
                  >
                    {marcusPending ? "Saving..." : "Resolve"}
                  </Button>

                  {marcusMessage && (
                    <div
                      className={cn(
                        "p-2 rounded text-[10px] leading-tight",
                        marcusMessage.type === "success"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : marcusMessage.type === "conflict"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse font-bold"
                            : marcusMessage.type === "retry"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      )}
                    >
                      {marcusMessage.text}
                    </div>
                  )}
                </div>
              </div>
            )}
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
