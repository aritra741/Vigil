"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { DashboardMetrics } from "@/lib/actions/transactions";

interface PulseData {
  metrics: DashboardMetrics;
  latestCriticalAlert: any | null;
  isConnected: boolean;
}

const PulseContext = createContext<PulseData | null>(null);

export function PulseProvider({
  children,
  initialMetrics,
}: {
  children: React.ReactNode;
  initialMetrics: DashboardMetrics;
}) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [latestCriticalAlert, setLatestCriticalAlert] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;

    function connect() {
      if (!active) return;
      
      // Close previous connection if any
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/pulse");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        // Attempt reconnect in 3s
        setTimeout(connect, 3000);
      };

      eventSource.addEventListener("pulse", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics((prev) => ({
            ...prev,
            transactionsToday: data.transactionsToday,
            flaggedCount: data.flaggedCount,
            valueUnderReview: data.valueUnderReview,
            openInvestigations: data.openInvestigations,
            avgResolutionHours: data.avgResolutionHours,
            ruleHitRate: data.ruleHitRate,
          }));
          setLatestCriticalAlert(data.latestCriticalAlert);
        } catch (e) {
          console.error("Failed to parse pulse event data", e);
        }
      });
    }

    connect();

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return (
    <PulseContext.Provider value={{ metrics, latestCriticalAlert, isConnected }}>
      {children}
    </PulseContext.Provider>
  );
}

export function usePulse() {
  return useContext(PulseContext);
}
