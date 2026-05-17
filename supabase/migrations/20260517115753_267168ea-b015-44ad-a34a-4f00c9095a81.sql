-- Allow action owners to delete their own tokens
CREATE POLICY "Action owners can delete their tokens"
ON public.action_tokens
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions
    WHERE actions.id = action_tokens.action_id
      AND actions.user_id = auth.uid()
  )
);

-- Prevent privilege escalation: drop and recreate INSERT policy so users
-- can never assign a role to themselves (only super_admins can assign roles to OTHER users)
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;

CREATE POLICY "Super admins can assign roles to other users"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND user_id <> auth.uid()
);