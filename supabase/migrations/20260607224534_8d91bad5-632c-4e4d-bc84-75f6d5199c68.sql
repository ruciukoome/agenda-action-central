
-- Revoke EXECUTE from anon/authenticated/public on SECURITY DEFINER functions
-- that should not be directly callable via the API.

-- Trigger functions (only invoked by triggers, never by API clients)
REVOKE EXECUTE ON FUNCTION public.accept_pending_invitations_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_creator_as_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Token lookup: only called by edge functions via service_role
REVOKE EXECUTE ON FUNCTION public.get_action_token_by_id_and_token(uuid, text) FROM PUBLIC, anon, authenticated;

-- RLS helper functions: used inside RLS policies, so authenticated must keep access,
-- but revoke direct calls from anon and PUBLIC.
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM PUBLIC, anon;
