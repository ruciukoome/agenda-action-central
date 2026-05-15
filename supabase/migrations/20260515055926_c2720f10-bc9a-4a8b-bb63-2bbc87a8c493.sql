ALTER TABLE public.actions ADD COLUMN IF NOT EXISTS meeting_title text;
CREATE INDEX IF NOT EXISTS idx_actions_meeting_title ON public.actions(meeting_title);

CREATE TABLE IF NOT EXISTS public.action_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  meeting_title text,
  description text,
  department public.action_department,
  meeting_date timestamp with time zone,
  priority public.action_priority,
  owner_email text,
  progress_status public.action_progress DEFAULT 'Not Started',
  notes text,
  due_date timestamp with time zone,
  cc_emails text[] DEFAULT '{}',
  bcc_emails text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_drafts_user_updated ON public.action_drafts(user_id, updated_at DESC);

ALTER TABLE public.action_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON public.action_drafts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON public.action_drafts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.action_drafts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.action_drafts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_action_drafts_updated_at
  BEFORE UPDATE ON public.action_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();