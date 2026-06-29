"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/lib/db/schema";
import type { SimulatedTransactionRow } from "@/lib/actions/transactions";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { SimulateButton } from "@/components/transactions/simulate-button";

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

export function TransactionsClient({ initialRows, total }: TransactionsClientProps) {
  const [rows, setRows] = useState<Transaction[]>(initialRows);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const timersRef = useRef<number[]>([]);

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

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Transactions</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total.toLocaleString()} transactions monitored
          </p>
        </div>
        <SimulateButton onBurstComplete={handleBurstComplete} />
      </div>

      <TransactionTable rows={rows} highlightedIds={highlightedIds} />
    </>
  );
}
