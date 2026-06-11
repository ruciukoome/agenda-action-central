
ALTER TABLE public.user_email_settings
  ADD COLUMN IF NOT EXISTS monthly_compliance_report boolean;

ALTER TABLE public.organization_email_settings
  ADD COLUMN IF NOT EXISTS monthly_compliance_report boolean;

CREATE OR REPLACE FUNCTION public.get_effective_email_pref(_user_id uuid, _org_id uuid, _key text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user boolean;
  v_org boolean;
  v_default boolean;
BEGIN
  IF _key NOT IN ('assignment_notifications','completion_updates','due_date_reminders','weekly_digest','monthly_compliance_report') THEN
    RETURN true;
  END IF;

  v_default := CASE WHEN _key IN ('weekly_digest','monthly_compliance_report') THEN false ELSE true END;

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
$function$;
