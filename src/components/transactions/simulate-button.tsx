"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { simulateTransactionBurst } from "@/lib/actions/transactions";

export function SimulateButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSimulate = () => {
    startTransition(async () => {
      try {
        const result = await simulateTransactionBurst();
        if (!result.success) {
          toast.error(result.error ?? "Simulation failed");
          return;
        }
        toast.success(
          `${result.transactions.length} transactions ingested. ${result.alertsCreated} alerts triggered.`,
          {
            description: result.alertsCreated > 0
              ? "Critical alerts may require investigation"
              : undefined,
          }
        );
        router.refresh();
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
