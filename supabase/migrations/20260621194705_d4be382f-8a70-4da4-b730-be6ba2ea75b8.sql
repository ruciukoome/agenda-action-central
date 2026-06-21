
CREATE OR REPLACE FUNCTION public.sync_action_to_stage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if we were invoked as a cascade from another trigger
  -- (e.g. handle_stage_progress_change updating actions); otherwise
  -- we'd try to re-update the same project_stages row mid-flight.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.progress_status IS DISTINCT FROM OLD.progress_status
     OR NEW.completed IS DISTINCT FROM OLD.completed THEN
    UPDATE public.project_stages
      SET progress_status = NEW.progress_status,
          updated_at = now()
      WHERE action_id = NEW.id
        AND progress_status IS DISTINCT FROM NEW.progress_status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_stage_progress_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dep public.project_stages%ROWTYPE;
  v_func_url text;
  v_anon_key text;
  v_any_unlocked boolean := false;
  v_remaining int;
BEGIN
  IF NEW.progress_status = '100%' AND (OLD.progress_status IS DISTINCT FROM '100%') THEN
    NEW.status := 'completed';
    NEW.actual_end_date := CURRENT_DATE;

    -- Only push down to actions when the change originated on the stage,
    -- not when sync_action_to_stage cascaded into us.
    IF pg_trigger_depth() = 1 AND NEW.action_id IS NOT NULL THEN
      UPDATE public.actions
        SET progress_status = '100%', completed = true, updated_at = now()
        WHERE id = NEW.action_id AND (progress_status <> '100%' OR completed = false);
    END IF;

    v_func_url := 'https://kjsmqsjyqenyprfvagxk.supabase.co/functions/v1/notify-stage-handoff';
    v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc21xc2p5cWVueXByZnZhZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDI2NjMsImV4cCI6MjA5MTkxODY2M30.JRbpjEydhqwI6VaEMepcE-Lw8BgUzunjsnuQdvGDicQ';

    FOR v_dep IN
      SELECT * FROM public.project_stages
      WHERE depends_on_stage_id = NEW.id AND status = 'locked'
    LOOP
      UPDATE public.project_stages
        SET status = 'ready',
            actual_start_date = CURRENT_DATE,
            planned_end_date = CURRENT_DATE + v_dep.planned_duration_days,
            updated_at = now()
        WHERE id = v_dep.id;

      v_any_unlocked := true;

      BEGIN
        PERFORM net.http_post(
          url := v_func_url,
          headers := jsonb_build_object('Content-Type','application/json','apikey',v_anon_key,'Authorization','Bearer '||v_anon_key),
          body := jsonb_build_object(
            'project_id', NEW.project_id,
            'completed_stage_id', NEW.id,
            'next_stage_id', v_dep.id
          )
        );
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;

    SELECT count(*) INTO v_remaining FROM public.project_stages
      WHERE project_id = NEW.project_id AND status <> 'completed' AND id <> NEW.id;
    IF v_remaining = 0 THEN
      UPDATE public.collaborative_projects SET status='completed', updated_at = now() WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
