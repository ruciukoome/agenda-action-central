
-- 1) Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  ics_uid text NOT NULL DEFAULT ('meeting-' || gen_random_uuid()::text || '@actioncentral'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_org_start_idx ON public.meetings(organization_id, start_at DESC);
CREATE INDEX IF NOT EXISTS meetings_created_by_idx ON public.meetings(created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org meetings"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can create org meetings"
  ON public.meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Creators or admins can update meetings"
  ON public.meetings FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_org_role(auth.uid(), organization_id) = 'admin'
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.get_user_org_role(auth.uid(), organization_id) = 'admin'
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Creators or admins can delete meetings"
  ON public.meetings FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_org_role(auth.uid(), organization_id) = 'admin'
    OR public.is_super_admin(auth.uid())
  );

CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Link actions to meetings (optional)
ALTER TABLE public.actions
  ADD COLUMN IF NOT EXISTS meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS actions_meeting_id_idx ON public.actions(meeting_id);
