ALTER TABLE public.organization_email_settings
  ADD COLUMN IF NOT EXISTS compliance_rule TEXT NOT NULL DEFAULT 'on_time'
  CHECK (compliance_rule IN ('on_time','any_completion'));