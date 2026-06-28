export interface QueryMetric {
  query: string;
  duration: number; // in milliseconds
  timestamp: number;
}

// Global in-memory query log. Since serverless functions might recycle memory,
// this acts as a session-based rolling buffer (ideal for local/demo telemetry).
let queryMetricsStore: QueryMetric[] = [];
let totalQueryCount = 0;

export function recordQueryMetric(query: string, duration: number) {
  totalQueryCount++;
  queryMetricsStore.push({
    query,
    duration,
    timestamp: Date.now(),
  });

  // Limit size to prevent memory leaks
  if (queryMetricsStore.length > 100) {
    queryMetricsStore.shift();
  }
}

export function getTelemetryData() {
  const recent = [...queryMetricsStore].reverse();
  const avgDuration =
    queryMetricsStore.length > 0
      ? queryMetricsStore.reduce((acc, curr) => acc + curr.duration, 0) /
        queryMetricsStore.length
      : 0;

  return {
    recent,
    totalQueries: totalQueryCount,
    avgLatency: Math.round(avgDuration * 10) / 10,
  };
}

export function clearTelemetry() {
  queryMetricsStore = [];
  totalQueryCount = 0;
}
