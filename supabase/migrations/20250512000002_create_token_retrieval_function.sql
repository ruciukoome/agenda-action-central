
-- Create a function to safely get action tokens by ID and token
CREATE OR REPLACE FUNCTION public.get_action_token_by_id_and_token(
  p_action_id UUID,
  p_token TEXT
) RETURNS SETOF public.action_tokens AS $$
BEGIN
  RETURN QUERY
  SELECT * 
  FROM public.action_tokens
  WHERE action_id = p_action_id 
  AND token = p_token
  AND used = FALSE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute privileges to anonymous users so they can validate tokens
GRANT EXECUTE ON FUNCTION public.get_action_token_by_id_and_token TO anon;
GRANT EXECUTE ON FUNCTION public.get_action_token_by_id_and_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_action_token_by_id_and_token TO service_role;
