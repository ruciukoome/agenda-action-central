
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { DbAction, mapDbActionToActionItem } from "./types";

/**
 * Fetches all actions from the database, scoped to the user's organization
 * Table: actions
 * Returns mapped action items with proper TypeScript types
 */
export async function fetchActions(organizationId?: string): Promise<ActionItem[]> {
  let query = supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }

  return data.map(action => mapDbActionToActionItem(action as DbAction));
}
