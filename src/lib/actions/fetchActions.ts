
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { DbAction, mapDbActionToActionItem } from "./types";

/**
 * Fetches all actions from the database
 * Table: actions
 * Returns mapped action items with proper TypeScript types
 */
export async function fetchActions(): Promise<ActionItem[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }

  return data.map(action => mapDbActionToActionItem(action as DbAction));
}
