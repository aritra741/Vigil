const OCC_SQLSTATE = "40001";
const BASE_DELAY_MS = 50;
const MAX_RETRIES = 3;

interface DatabaseError extends Error {
  code?: string;
}

function isDatabaseError(err: unknown): err is DatabaseError {
  return err instanceof Error && "code" in err;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isOCC = isDatabaseError(err) && err.code === OCC_SQLSTATE;
      if (isOCC && attempt < maxRetries) {
        const backoff = BASE_DELAY_MS * 2 ** attempt;
        const jitter = Math.random() * backoff;
        await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: unreachable");
}
