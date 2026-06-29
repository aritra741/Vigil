"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  simulateTransactionBurst,
  type BurstAlertSummary,
  type SimulatedTransactionRow,
} from "@/lib/actions/transactions";

interface SimulateButtonProps {
  onBurstComplete?: (transactions: SimulatedTransactionRow[]) => void;
}

const describeCorridor = (alert: BurstAlertSummary) =>
  `${alert.senderCountry} -> ${alert.receiverCountry}`;

export function SimulateButton({ onBurstComplete }: SimulateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSimulate = () => {
    startTransition(async () => {
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

        onBurstComplete?.(result.transactions);

        if (!onBurstComplete) {
          router.refresh();
        }
      } catch {
        toast.error("Failed to simulate transaction burst");
      }
    });
  };

  return (
    <Button
      onClick={handleSimulate}
      disabled={isPending}
      className="bg-violet-600 hover:bg-violet-700 text-white"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Zap className="h-4 w-4 mr-2" />
      )}
      Simulate Burst
    </Button>
  );
}
