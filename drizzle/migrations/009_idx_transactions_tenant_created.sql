CREATE INDEX ASYNC idx_transactions_tenant_created ON transactions (tenant_id, created_at);
