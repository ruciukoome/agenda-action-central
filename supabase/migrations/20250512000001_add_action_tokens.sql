
-- Create table to store action update tokens
CREATE TABLE IF NOT EXISTS public.action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS action_tokens_token_idx ON public.action_tokens(token);

-- Enable Row Level Security
ALTER TABLE public.action_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anon users to use tokens
-- This is necessary so unauthenticated users can validate their tokens
CREATE POLICY "Allow anonymous users to select tokens"
  ON public.action_tokens
  FOR SELECT
  TO anon
  USING (true);
