-- organization_email_settings
CREATE TABLE public.organization_email_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  assignment_notifications boolean NOT NULL DEFAULT true,
  completion_updates boolean NOT NULL DEFAULT true,
  due_date_reminders boolean NOT NULL DEFAULT true,
  weekly_digest boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_email_settings TO authenticated;
GRANT ALL ON public.organization_email_settings TO service_role;

ALTER TABLE public.organization_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read email settings"
  ON public.organization_email_settings FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert email settings"
  ON public.organization_email_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_org_role(auth.uid(), organization_id) = 'admin');

CREATE POLICY "Org admins can update email settings"
  ON public.organization_email_settings FOR UPDATE
  TO authenticated
  USING (public.get_user_org_role(auth.uid(), organization_id) = 'admin')
  WITH CHECK (public.get_user_org_role(auth.uid(), organization_id) = 'admin');

CREATE POLICY "Org admins can delete email settings"
  ON public.organization_email_settings FOR DELETE
  TO authenticated
  USING (public.get_user_org_role(auth.uid(), organization_id) = 'admin');

CREATE TRIGGER trg_org_email_settings_updated_at
  BEFORE UPDATE ON public.organization_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_email_settings (per-user overrides; NULL = inherit)
CREATE TABLE public.user_email_settings (
  user_id uuid PRIMARY KEY,
  organization_id uuid,
  assignment_notifications boolean,
  completion_updates boolean,
  due_date_reminders boolean,
  weekly_digest boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_email_settings TO authenticated;
GRANT ALL ON public.user_email_settings TO service_role;

ALTER TABLE public.user_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own email settings"
  ON public.user_email_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own email settings"
  ON public.user_email_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own email settings"
  ON public.user_email_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own email settings"
  ON public.user_email_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_user_email_settings_updated_at
  BEFORE UPDATE ON public.user_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective preference resolver
CREATE OR REPLACE FUNCTION public.get_effective_email_pref(_user_id uuid, _org_id uuid, _key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user boolean;
  v_org boolean;
  v_default boolean;
BEGIN
  IF _key NOT IN ('assignment_notifications','completion_updates','due_date_reminders','weekly_digest') THEN
    RETURN true;
  END IF;

  v_default := CASE WHEN _key = 'weekly_digest' THEN false ELSE true END;

  EXECUTE format('SELECT %I FROM public.user_email_settings WHERE user_id = $1', _key)
    INTO v_user USING _user_id;
  IF v_user IS NOT NULL THEN
    RETURN v_user;
  END IF;

  IF _org_id IS NOT NULL THEN
    EXECUTE format('SELECT %I FROM public.organization_email_settings WHERE organization_id = $1', _key)
      INTO v_org USING _org_id;
    IF v_org IS NOT NULL THEN
      RETURN v_org;
    END IF;
  END IF;

  RETURN v_default;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_effective_email_pref(uuid, uuid, text) TO authenticated, anon, service_role;