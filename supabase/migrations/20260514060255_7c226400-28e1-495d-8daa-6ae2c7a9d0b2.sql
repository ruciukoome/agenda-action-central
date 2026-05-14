ALTER TABLE public.pending_invitations
  ADD COLUMN IF NOT EXISTS last_resent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_resend_status text,
  ADD COLUMN IF NOT EXISTS last_resend_error text,
  ADD COLUMN IF NOT EXISTS resend_count integer NOT NULL DEFAULT 0;

CREATE POLICY "Org admins update invitations"
ON public.pending_invitations
FOR UPDATE
TO authenticated
USING ((get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role) OR is_super_admin(auth.uid()))
WITH CHECK ((get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role) OR is_super_admin(auth.uid()));