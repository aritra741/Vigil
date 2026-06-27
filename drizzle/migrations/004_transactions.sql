CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  sender_name TEXT NOT NULL,
  sender_country TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_country TEXT NOT NULL,
  payment_rail TEXT NOT NULL,
  risk_score NUMERIC(4,3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
