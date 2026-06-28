import { recordOccRetry } from "@/lib/db/telemetry";
import {
  AppDatabaseError,
  OCC_CONFLICT_CODE,
  isDatabaseError,
} from "@/lib/utils/db-errors";

const BASE_DELAY_MS = 50;
const MAX_RETRIES = 3;

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (err instanceof AppDatabaseError) throw err;

      const isOCC = isDatabaseError(err) && err.code === OCC_CONFLICT_CODE;
      if (isOCC && attempt < maxRetries) {
        recordOccRetry();
        const backoff = BASE_DELAY_MS * 2 ** attempt;
        const jitter = Math.random() * backoff;
        await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
        continue;
      }

      if (isOCC) {
        throw new AppDatabaseError(
          "Transaction conflict (SQLSTATE 40001). Another writer won the race — please retry.",
          OCC_CONFLICT_CODE
        );
      }

      throw err;
    }
  }
  throw new Error("withRetry: unreachable");
}
