
ALTER TABLE generation_periods ADD COLUMN purpose text NOT NULL DEFAULT 'survey';

CREATE UNIQUE INDEX idx_one_active_period_per_purpose
  ON generation_periods (tenant_id, purpose)
  WHERE status = 'active' AND deleted_at IS NULL;
