CREATE OR REPLACE FUNCTION public.handle_stage_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next public.project_stages%ROWTYPE;
  v_func_url text;
  v_anon_key text;
BEGIN
  IF NEW.progress_status = '100%' AND (OLD.progress_status IS DISTINCT FROM '100%') THEN
    NEW.status := 'completed';
    NEW.actual_end_date := CURRENT_DATE;

    IF NEW.action_id IS NOT NULL THEN
      UPDATE public.actions
        SET progress_status = '100%', completed = true, updated_at = now()
        WHERE id = NEW.action_id AND (progress_status <> '100%' OR completed = false);
    END IF;

    SELECT * INTO v_next FROM public.project_stages
      WHERE project_id = NEW.project_id AND sequence = NEW.sequence + 1;

    IF FOUND THEN
      UPDATE public.project_stages
        SET status = 'ready',
            actual_start_date = CURRENT_DATE,
            planned_end_date = CURRENT_DATE + v_next.planned_duration_days,
            updated_at = now()
        WHERE id = v_next.id;

      BEGIN
        v_func_url := 'https://kjsmqsjyqenyprfvagxk.supabase.co/functions/v1/notify-stage-handoff';
        v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc21xc2p5cWVueXByZnZhZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDI2NjMsImV4cCI6MjA5MTkxODY2M30.JRbpjEydhqwI6VaEMepcE-Lw8BgUzunjsnuQdvGDicQ';
        PERFORM net.http_post(
          url := v_func_url,
          headers := jsonb_build_object('Content-Type','application/json','apikey',v_anon_key,'Authorization','Bearer '||v_anon_key),
          body := jsonb_build_object(
            'project_id', NEW.project_id,
            'completed_stage_id', NEW.id,
            'next_stage_id', v_next.id
          )
        );
      EXCEPTION WHEN OTHERS THEN NULL; END;
    ELSE
      UPDATE public.collaborative_projects SET status='completed', updated_at = now() WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_stage_progress_change() FROM PUBLIC, anon, authenticated;