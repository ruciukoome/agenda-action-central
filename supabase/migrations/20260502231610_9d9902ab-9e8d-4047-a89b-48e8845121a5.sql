
-- Pending invitations table for inviting users by email before they sign up
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (organization_id, email)
);

CREATE INDEX idx_pending_invitations_email ON public.pending_invitations (lower(email)) WHERE accepted_at IS NULL;

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Org admins (and super admins) can view their org's invitations
CREATE POLICY "Org admins view invitations"
ON public.pending_invitations
FOR SELECT
TO authenticated
USING (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role
  OR public.is_super_admin(auth.uid())
);

-- Org admins can create invitations
CREATE POLICY "Org admins create invitations"
ON public.pending_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  (public.get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role
   OR public.is_super_admin(auth.uid()))
  AND invited_by = auth.uid()
);

-- Org admins can delete (revoke) invitations
CREATE POLICY "Org admins delete invitations"
ON public.pending_invitations
FOR DELETE
TO authenticated
USING (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role
  OR public.is_super_admin(auth.uid())
);

-- On new user signup, auto-accept any pending invitations matching their email
CREATE OR REPLACE FUNCTION public.accept_pending_invitations_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT id, organization_id, role
    FROM public.pending_invitations
    WHERE lower(email) = lower(NEW.email)
      AND accepted_at IS NULL
  LOOP
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (inv.organization_id, NEW.id, inv.role)
    ON CONFLICT DO NOTHING;

    UPDATE public.pending_invitations
    SET accepted_at = now()
    WHERE id = inv.id;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_accept_invites ON auth.users;
CREATE TRIGGER on_auth_user_created_accept_invites
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.accept_pending_invitations_on_signup();

-- Ensure organization_members has unique (organization_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_members_org_user_unique'
  ) THEN
    ALTER TABLE public.organization_members
    ADD CONSTRAINT organization_members_org_user_unique UNIQUE (organization_id, user_id);
  END IF;
END $$;
