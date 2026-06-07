/**
 * MEETINGS
 * Helpers to fetch and create meetings that group action points and produce ICS invites.
 */
import { supabase } from "@/integrations/supabase/client";
import { Meeting } from "@/types/action";

function mapRow(r: any): Meeting {
  return {
    id: r.id,
    organizationId: r.organization_id,
    createdBy: r.created_by,
    title: r.title,
    description: r.description,
    location: r.location,
    startAt: r.start_at,
    endAt: r.end_at,
    timezone: r.timezone,
    icsUid: r.ics_uid,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listOrgMeetings(organizationId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings" as any)
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from("meetings" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export interface NewMeetingInput {
  organizationId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string; // ISO
  endAt: string;   // ISO
  timezone: string;
}

export async function createMeeting(input: NewMeetingInput): Promise<Meeting> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("meetings" as any)
    .insert({
      organization_id: input.organizationId,
      created_by: userData.user.id,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      start_at: input.startAt,
      end_at: input.endAt,
      timezone: input.timezone,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}
