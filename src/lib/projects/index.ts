import { supabase } from "@/integrations/supabase/client";
import { sendActionNotification } from "@/lib/notifications";
import { mapDbActionToActionItem, DbAction } from "@/lib/actions/types";

export type ProjectStatus = "planning" | "active" | "completed" | "cancelled";
export type StageStatus = "locked" | "ready" | "in_progress" | "completed" | "overdue";
export type ProgressStatus = "Not Started" | "25%" | "50%" | "75%" | "100%" | "Continuous";

export interface CollaborativeProject {
  id: string;
  organization_id: string;
  created_by: string;
  owner_user_id: string | null;
  owner_email: string;
  title: string;
  description: string | null;
  start_date: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectStage {
  id: string;
  project_id: string;
  sequence: number;
  title: string;
  skill_required: string | null;
  owner_email: string;
  owner_user_id: string | null;
  planned_duration_days: number;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  status: StageStatus;
  progress_status: ProgressStatus;
  notes: string | null;
  action_id: string | null;
  depends_on_stage_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewStageInput {
  title: string;
  skill_required?: string;
  owner_email: string;
  planned_duration_days: number;
}

export interface NewProjectInput {
  organization_id: string;
  title: string;
  description?: string;
  owner_email: string;
  start_date: string; // yyyy-mm-dd
  stages: NewStageInput[];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function fetchProjects(organizationId: string): Promise<CollaborativeProject[]> {
  const { data, error } = await supabase
    .from("collaborative_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CollaborativeProject[];
}

export async function fetchProject(id: string): Promise<CollaborativeProject | null> {
  const { data, error } = await supabase
    .from("collaborative_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as CollaborativeProject) ?? null;
}

export async function fetchStages(projectId: string): Promise<ProjectStage[]> {
  const { data, error } = await supabase
    .from("project_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("sequence", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProjectStage[];
}

export async function fetchAllStagesForOrg(organizationId: string): Promise<ProjectStage[]> {
  const { data: projects } = await supabase
    .from("collaborative_projects")
    .select("id")
    .eq("organization_id", organizationId);
  const ids = (projects ?? []).map((p: any) => p.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("project_stages")
    .select("*")
    .in("project_id", ids)
    .order("sequence", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProjectStage[];
}

/**
 * Creates a collaborative project and all its stages, plus a linked `actions` row
 * for each stage so existing Kanban/My Actions views surface the work.
 */
export async function createProjectWithStages(input: NewProjectInput): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  if (!input.stages.length) throw new Error("At least one stage is required");

  // Create the project
  const { data: project, error: projErr } = await supabase
    .from("collaborative_projects")
    .insert({
      organization_id: input.organization_id,
      created_by: userData.user.id,
      owner_email: input.owner_email,
      title: input.title,
      description: input.description ?? null,
      start_date: input.start_date,
      status: "active",
    })
    .select()
    .single();
  if (projErr || !project) throw projErr ?? new Error("Project insert failed");

  // Compute planned dates
  let cursor = input.start_date;
  const stageRows: any[] = [];
  const actionRows: any[] = [];

  for (let i = 0; i < input.stages.length; i++) {
    const s = input.stages[i];
    const plannedStart = cursor;
    const plannedEnd = addDays(plannedStart, s.planned_duration_days);
    cursor = plannedEnd;

    const sequence = i + 1;
    const status: StageStatus = sequence === 1 ? "ready" : "locked";

    // Insert action first so we can link stage.action_id
    const { data: action, error: actErr } = await supabase
      .from("actions")
      .insert({
        description: `[${input.title}] Stage ${sequence}: ${s.title}`,
        department: "Operations" as any,
        meeting_date: new Date().toISOString(),
        meeting_title: `Project: ${input.title}`,
        priority: "medium" as any,
        owner_email: s.owner_email,
        completed: false,
        progress_status: "Not Started" as any,
        notes: s.skill_required ? `Skill required: ${s.skill_required}` : "",
        user_id: userData.user.id,
        organization_id: input.organization_id,
        due_date: new Date(plannedEnd + "T23:59:59Z").toISOString(),
      })
      .select()
      .single();
    if (actErr) throw actErr;

    stageRows.push({
      project_id: project.id,
      sequence,
      title: s.title,
      skill_required: s.skill_required ?? null,
      owner_email: s.owner_email,
      planned_duration_days: s.planned_duration_days,
      planned_start_date: plannedStart,
      planned_end_date: plannedEnd,
      actual_start_date: sequence === 1 ? input.start_date : null,
      status,
      progress_status: "Not Started" as any,
      action_id: action?.id ?? null,
    });
    actionRows.push(action);
  }

  const { data: insertedStages, error: stagesErr } = await supabase
    .from("project_stages")
    .insert(stageRows)
    .select();
  if (stagesErr) throw stagesErr;

  // Set default linear dependencies: stage N depends on stage N-1
  const ordered = (insertedStages ?? []).slice().sort((a: any, b: any) => a.sequence - b.sequence);
  for (let i = 1; i < ordered.length; i++) {
    await supabase
      .from("project_stages")
      .update({ depends_on_stage_id: ordered[i - 1].id } as any)
      .eq("id", ordered[i].id);
  }

  // Send assignment emails to every stage owner so they know a task is
  // waiting on them (locked stages will get a separate handoff email when
  // their dependency completes). Failures must not abort project creation.
  for (const action of actionRows) {
    if (!action) continue;
    try {
      const item = mapDbActionToActionItem(action as DbAction);
      await sendActionNotification(item, "assigned");
    } catch (e) {
      console.error("[createProjectWithStages] notify failed", e);
    }
  }

  return project.id as string;
}

export async function updateStageProgress(stageId: string, progress: ProgressStatus): Promise<void> {
  const { error } = await supabase
    .from("project_stages")
    .update({ progress_status: progress as any })
    .eq("id", stageId);
  if (error) throw error;
}

export async function updateStageDependency(
  stageId: string,
  dependsOnStageId: string | null,
): Promise<void> {
  const patch: any = {
    depends_on_stage_id: dependsOnStageId,
    // If dep cleared, this stage becomes immediately ready; otherwise lock until dep completes
    status: dependsOnStageId ? "locked" : "ready",
  };
  const { error } = await supabase.from("project_stages").update(patch).eq("id", stageId);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("collaborative_projects").delete().eq("id", id);
  if (error) throw error;
}
