export const OCC_CONFLICT_CODE = "40001";
export const VERSION_CONFLICT_CODE = "VERSION_CONFLICT";

export class AppDatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppDatabaseError";
  }
}

interface DatabaseError extends Error {
  code?: string;
}

export function isDatabaseError(err: unknown): err is DatabaseError {
  return err instanceof Error && "code" in err;
}

export function getErrorCode(err: unknown): string | undefined {
  if (err instanceof AppDatabaseError) return err.code;
  if (isDatabaseError(err) && err.code === OCC_CONFLICT_CODE) {
    return OCC_CONFLICT_CODE;
  }
  return undefined;
}
