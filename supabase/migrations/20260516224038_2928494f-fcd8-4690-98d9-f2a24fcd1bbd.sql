DROP POLICY IF EXISTS "Org admins can add members" ON public.organization_members;

CREATE POLICY "Org admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_org_role(auth.uid(), organization_id) = 'admin'::org_role
  OR is_super_admin(auth.uid())
);