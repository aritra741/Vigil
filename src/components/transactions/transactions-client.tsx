"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/lib/db/schema";
import {
  simulateTransactionBurst,
  type BurstAlertSummary,
  type SimulatedTransactionRow,
} from "@/lib/actions/transactions";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { toast } from "sonner";

interface TransactionsClientProps {
  initialRows: Transaction[];
  total: number;
}

const toTransaction = (row: SimulatedTransactionRow): Transaction => ({
  ...row,
  createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  tenantId: "demo-live",
  idempotencyKey: `live-${row.id}`,
  metadataText: null,
});

const describeCorridor = (alert: BurstAlertSummary) =>
  `${alert.senderCountry} -> ${alert.receiverCountry}`;

export function TransactionsClient({ initialRows, total }: TransactionsClientProps) {
  const [rows, setRows] = useState<Transaction[]>(initialRows);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const timersRef = useRef<number[]>([]);
  const hasTriggeredBurstRef = useRef(false);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const handleBurstComplete = (newRows: SimulatedTransactionRow[]) => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    const seen = new Set(rows.map((row) => row.id));
    const freshRows = newRows.filter((row) => !seen.has(row.id));

    if (freshRows.length === 0) return;

    setHighlightedIds(freshRows.map((row) => row.id));

    freshRows.forEach((row, index) => {
      const timer = window.setTimeout(() => {
        setRows((current) => [toTransaction(row), ...current.filter((existing) => existing.id !== row.id)]);
      }, index * 280);
      timersRef.current.push(timer);
    });

    const fadeTimer = window.setTimeout(() => {
      setHighlightedIds([]);
    }, freshRows.length * 280 + 2200);
    timersRef.current.push(fadeTimer);
  };

  useEffect(() => {
    if (hasTriggeredBurstRef.current) return;
    hasTriggeredBurstRef.current = true;

    const runBurst = async () => {
      try {
        const result = await simulateTransactionBurst();
        if (!result.success || !result.transactions || result.alertsCreated === undefined) {
          toast.error(result.error ?? "Simulation failed");
          return;
        }

        const isReplay = result.idempotentReplay;

        toast.success(
          isReplay
            ? `${result.transactions.length} transactions already ingested (idempotent replay).`
            : `${result.transactions.length} transactions ingested. ${result.alertsCreated} alerts triggered.`,
          {
            description: isReplay
              ? "Duplicate burst suppressed by tenant-scoped idempotency keys"
              : "Live metrics and queues will update as the burst settles.",
          }
        );

        if (!isReplay && result.alerts?.length) {
          result.alerts
            .filter((alert) => alert.severity === "critical" || alert.severity === "high")
            .forEach((alert, index) => {
              window.setTimeout(() => {
                const variant = alert.severity === "critical" ? toast.error : toast.warning;
                variant(alert.title, {
                  description: `${alert.currency} ${alert.amount} · ${describeCorridor(alert)}`,
                });
              }, 350 + index * 500);
            });
        }

        handleBurstComplete(result.transactions);
      } catch {
        toast.error("Failed to simulate transaction burst");
      }
    };

    void runBurst();
  }, [rows]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Transactions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {total.toLocaleString()} transactions monitored
        </p>
      </div>

      <TransactionTable rows={rows} highlightedIds={highlightedIds} />
    </>
  );
}
