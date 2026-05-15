import { supabase } from "@/integrations/supabase/client";
import { ActionItem, Department, Priority, ProgressStatus } from "@/types/action";
import { createAction } from "@/lib/actions";

export interface ActionDraft {
  id: string;
  meetingTitle?: string;
  description?: string;
  department?: Department;
  meetingDate?: string;
  priority?: Priority;
  ownerEmail?: string;
  progressStatus?: ProgressStatus;
  notes?: string;
  dueDate?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: any): ActionDraft {
  return {
    id: row.id,
    meetingTitle: row.meeting_title || undefined,
    description: row.description || undefined,
    department: row.department || undefined,
    meetingDate: row.meeting_date || undefined,
    priority: row.priority || undefined,
    ownerEmail: row.owner_email || undefined,
    progressStatus: row.progress_status || undefined,
    notes: row.notes || undefined,
    dueDate: row.due_date || undefined,
    ccEmails: row.cc_emails || [],
    bccEmails: row.bcc_emails || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type DraftPayload = Partial<Omit<ActionDraft, "id" | "createdAt" | "updatedAt">>;

function toDbPayload(payload: DraftPayload) {
  return {
    meeting_title: payload.meetingTitle ?? null,
    description: payload.description ?? null,
    department: (payload.department as any) ?? null,
    meeting_date: payload.meetingDate ?? null,
    priority: (payload.priority as any) ?? null,
    owner_email: payload.ownerEmail ?? null,
    progress_status: (payload.progressStatus as any) ?? null,
    notes: payload.notes ?? null,
    due_date: payload.dueDate ?? null,
    cc_emails: payload.ccEmails ?? [],
    bcc_emails: payload.bccEmails ?? [],
  };
}

export async function listDrafts(): Promise<ActionDraft[]> {
  const { data, error } = await supabase
    .from("action_drafts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getDraft(id: string): Promise<ActionDraft | null> {
  const { data, error } = await supabase
    .from("action_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createDraft(payload: DraftPayload): Promise<ActionDraft> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  let organizationId: string | null = null;
  const { data: memberData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (memberData) organizationId = memberData.organization_id;

  const { data, error } = await supabase
    .from("action_drafts")
    .insert({
      ...toDbPayload(payload),
      user_id: userData.user.id,
      organization_id: organizationId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateDraft(id: string, payload: DraftPayload): Promise<ActionDraft> {
  const { data, error } = await supabase
    .from("action_drafts")
    .update(toDbPayload(payload))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase.from("action_drafts").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Promotes a draft to a real action: creates the action (sends email)
 * and deletes the draft on success.
 */
export async function promoteDraftToAction(
  draftId: string,
  action: Omit<ActionItem, "id" | "createdAt" | "updatedAt">
): Promise<ActionItem> {
  const created = await createAction(action);
  try {
    await deleteDraft(draftId);
  } catch (e) {
    console.error("Failed to delete draft after promotion", e);
  }
  return created;
}
