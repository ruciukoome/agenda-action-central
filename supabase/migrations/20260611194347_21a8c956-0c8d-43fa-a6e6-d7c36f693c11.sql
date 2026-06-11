ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS depends_on_stage_id uuid
    REFERENCES public.project_stages(id) ON DELETE SET NULL;

-- Backfill: each stage depends on the previous one in its project
UPDATE public.project_stages s
SET depends_on_stage_id = prev.id
FROM public.project_stages prev
WHERE prev.project_id = s.project_id
  AND prev.sequence = s.sequence - 1
  AND s.depends_on_stage_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_stages_depends_on
  ON public.project_stages(depends_on_stage_id);

-- Updated handoff trigger: unlock every stage whose dependency just completed
CREATE OR REPLACE FUNCTION public.handle_stage_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    IF NEW.action_id IS NOT NULL THEN
      UPDATE public.actions
        SET progress_status = '100%', completed = true, updated_at = now()
        WHERE id = NEW.action_id AND (progress_status <> '100%' OR completed = false);
    END IF;

    v_func_url := 'https://kjsmqsjyqenyprfvagxk.supabase.co/functions/v1/notify-stage-handoff';
    v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc21xc2p5cWVueXByZnZhZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDI2NjMsImV4cCI6MjA5MTkxODY2M30.JRbpjEydhqwI6VaEMepcE-Lw8BgUzunjsnuQdvGDicQ';

    -- Unlock every stage that was waiting on the one that just completed
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

    -- If nothing remains locked or in-progress, mark project completed
    SELECT count(*) INTO v_remaining FROM public.project_stages
      WHERE project_id = NEW.project_id AND status <> 'completed' AND id <> NEW.id;
    IF v_remaining = 0 THEN
      UPDATE public.collaborative_projects SET status='completed', updated_at = now() WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_stage_progress_change() FROM PUBLIC, anon, authenticated;