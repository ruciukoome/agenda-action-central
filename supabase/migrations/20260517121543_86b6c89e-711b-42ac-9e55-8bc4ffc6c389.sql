
DROP POLICY IF EXISTS "Action owners can read their tokens" ON public.action_tokens;
DROP POLICY IF EXISTS "Action owners can update their tokens" ON public.action_tokens;
DROP POLICY IF EXISTS "Action owners can delete their tokens" ON public.action_tokens;
DROP POLICY IF EXISTS "Action owners can create tokens" ON public.action_tokens;

CREATE POLICY "Owners or org admins can read action tokens"
ON public.action_tokens FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions a
    WHERE a.id = action_tokens.action_id
      AND (
        a.user_id = auth.uid()
        OR (a.organization_id IS NOT NULL AND public.get_user_org_role(auth.uid(), a.organization_id) = 'admin'::org_role)
        OR public.is_super_admin(auth.uid())
      )
  )
);

CREATE POLICY "Owners or org admins can create action tokens"
ON public.action_tokens FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.actions a
    WHERE a.id = action_tokens.action_id
      AND (
        a.user_id = auth.uid()
        OR (a.organization_id IS NOT NULL AND public.get_user_org_role(auth.uid(), a.organization_id) = 'admin'::org_role)
        OR public.is_super_admin(auth.uid())
      )
  )
);

CREATE POLICY "Owners or org admins can update action tokens"
ON public.action_tokens FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions a
    WHERE a.id = action_tokens.action_id
      AND (
        a.user_id = auth.uid()
        OR (a.organization_id IS NOT NULL AND public.get_user_org_role(auth.uid(), a.organization_id) = 'admin'::org_role)
        OR public.is_super_admin(auth.uid())
      )
  )
);

CREATE POLICY "Owners or org admins can delete action tokens"
ON public.action_tokens FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions a
    WHERE a.id = action_tokens.action_id
      AND (
        a.user_id = auth.uid()
        OR (a.organization_id IS NOT NULL AND public.get_user_org_role(auth.uid(), a.organization_id) = 'admin'::org_role)
        OR public.is_super_admin(auth.uid())
      )
  )
);
