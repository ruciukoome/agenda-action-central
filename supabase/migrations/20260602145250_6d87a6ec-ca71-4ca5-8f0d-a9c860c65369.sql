CREATE TYPE public.owner_response_status AS ENUM ('pending', 'accepted', 'rejected');

ALTER TABLE public.actions
  ADD COLUMN owner_response public.owner_response_status NOT NULL DEFAULT 'pending',
  ADD COLUMN owner_responded_at timestamptz NULL;