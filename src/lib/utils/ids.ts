export function generateId(): string {
  return crypto.randomUUID();
}

export function generateIdempotencyKey(): string {
  return `txn_${crypto.randomUUID()}`;
}
