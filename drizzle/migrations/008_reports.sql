CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  date_range_start TIMESTAMP NOT NULL,
  date_range_end TIMESTAMP NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_flagged INTEGER NOT NULL DEFAULT 0,
  total_resolved INTEGER NOT NULL DEFAULT 0,
  summary_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
