
-- Enums
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('planning','active','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.stage_status AS ENUM ('locked','ready','in_progress','completed','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- collaborative_projects
CREATE TABLE public.collaborative_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  owner_user_id uuid,
  owner_email text NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.project_status NOT NULL DEFAULT 'planning',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborative_projects TO authenticated;
GRANT ALL ON public.collaborative_projects TO service_role;

ALTER TABLE public.collaborative_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view projects"
  ON public.collaborative_projects FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create projects"
  ON public.collaborative_projects FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Org members can update projects"
  ON public.collaborative_projects FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can delete projects"
  ON public.collaborative_projects FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER trg_collaborative_projects_updated_at
  BEFORE UPDATE ON public.collaborative_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- project_stages
CREATE TABLE public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.collaborative_projects(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  title text NOT NULL,
  skill_required text,
  owner_email text NOT NULL,
  owner_user_id uuid,
  planned_duration_days integer NOT NULL DEFAULT 1 CHECK (planned_duration_days > 0),
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  status public.stage_status NOT NULL DEFAULT 'locked',
  progress_status public.action_progress NOT NULL DEFAULT 'Not Started',
  notes text,
  action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, sequence)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stages TO authenticated;
GRANT ALL ON public.project_stages TO service_role;

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stages"
  ON public.project_stages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_projects p
    WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.organization_id)
  ));

CREATE POLICY "Org members can insert stages"
  ON public.project_stages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collaborative_projects p
    WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.organization_id)
  ));

CREATE POLICY "Org members can update stages"
  ON public.project_stages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_projects p
    WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collaborative_projects p
    WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.organization_id)
  ));

CREATE POLICY "Org members can delete stages"
  ON public.project_stages FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_projects p
    WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.organization_id)
  ));

CREATE TRIGGER trg_project_stages_updated_at
  BEFORE UPDATE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_stages_project_id ON public.project_stages(project_id);
CREATE INDEX idx_project_stages_action_id ON public.project_stages(action_id);

-- Email preference columns
ALTER TABLE public.user_email_settings
  ADD COLUMN IF NOT EXISTS project_stage_assignment boolean,
  ADD COLUMN IF NOT EXISTS project_handoff boolean,
  ADD COLUMN IF NOT EXISTS project_overrun boolean;

ALTER TABLE public.organization_email_settings
  ADD COLUMN IF NOT EXISTS project_stage_assignment boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS project_handoff boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS project_overrun boolean DEFAULT true;

-- Stage handoff trigger
CREATE OR REPLACE FUNCTION public.handle_stage_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next public.project_stages%ROWTYPE;
  v_project public.collaborative_projects%ROWTYPE;
  v_func_url text;
  v_anon_key text;
BEGIN
  -- Only act when progress becomes 100%
  IF NEW.progress_status = '100%' AND (OLD.progress_status IS DISTINCT FROM '100%') THEN
    NEW.status := 'completed';
    NEW.actual_end_date := CURRENT_DATE;

    -- Sync linked action
    IF NEW.action_id IS NOT NULL THEN
      UPDATE public.actions
        SET progress_status = '100%', completed = true, updated_at = now()
        WHERE id = NEW.action_id AND (progress_status <> '100%' OR completed = false);
    END IF;

    -- Unlock the next stage
    SELECT * INTO v_next FROM public.project_stages
      WHERE project_id = NEW.project_id AND sequence = NEW.sequence + 1;

    IF FOUND THEN
      UPDATE public.project_stages
        SET status = 'ready',
            actual_start_date = CURRENT_DATE,
            planned_end_date = CURRENT_DATE + v_next.planned_duration_days,
            updated_at = now()
        WHERE id = v_next.id;

      SELECT * INTO v_project FROM public.collaborative_projects WHERE id = NEW.project_id;

      -- Fire-and-forget notification
      BEGIN
        v_func_url := 'https://kjsmqsjyqenyprfvagxk.supabase.co/functions/v1/notify-stage-handoff';
        v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc21xc2p5cWVueXByZnZhZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDI2NjMsImV4cCI6MjA5MTkxODY2M30.JRbpjEydhqwI6VaEMepcE-Lw8BgUzunjsnuQdvGDicQ';
        PERFORM extensions.http_post(
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
      -- Last stage; mark project completed
      UPDATE public.collaborative_projects SET status='completed', updated_at = now() WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stage_progress_change
  BEFORE UPDATE OF progress_status ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.handle_stage_progress_change();

-- Sync action completion back to its stage
CREATE OR REPLACE FUNCTION public.sync_action_to_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE TRIGGER trg_sync_action_to_stage
  AFTER UPDATE OF progress_status, completed ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.sync_action_to_stage();
