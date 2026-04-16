-- Drop existing insecure policies on action_tokens
DROP POLICY IF EXISTS "Anyone can read action tokens" ON public.action_tokens;
DROP POLICY IF EXISTS "Authenticated users can create action tokens" ON public.action_tokens;
DROP POLICY IF EXISTS "Authenticated users can update action tokens" ON public.action_tokens;

-- SELECT: Only the owner of the associated action can read tokens
CREATE POLICY "Action owners can read their tokens"
ON public.action_tokens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions
    WHERE actions.id = action_tokens.action_id
      AND actions.user_id = auth.uid()
  )
);

-- Also allow anonymous/public reads by token value via the RPC function (SECURITY DEFINER)
-- No direct public SELECT needed since get_action_token_by_id_and_token is SECURITY DEFINER

-- INSERT: Only the owner of the referenced action can create tokens
CREATE POLICY "Action owners can create tokens"
ON public.action_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.actions
    WHERE actions.id = action_tokens.action_id
      AND actions.user_id = auth.uid()
  )
);

-- UPDATE: Only the owner of the referenced action can update tokens
CREATE POLICY "Action owners can update their tokens"
ON public.action_tokens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actions
    WHERE actions.id = action_tokens.action_id
      AND actions.user_id = auth.uid()
  )
);