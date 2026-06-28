CREATE UNIQUE INDEX ASYNC idx_transactions_tenant_idempotency_unique ON transactions (tenant_id, idempotency_key);
