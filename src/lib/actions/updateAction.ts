
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { DbAction, mapActionItemToDbAction, mapDbActionToActionItem } from "./types";

/**
 * Updates an existing action in the database
 * Table: actions
 */
export async function updateAction(action: ActionItem): Promise<ActionItem> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const dbAction = mapActionItemToDbAction(action);

  const { data, error } = await supabase
    .from('actions')
    .update(dbAction)
    .eq('id', action.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating action:', error);
    throw error;
  }

  return mapDbActionToActionItem(data as DbAction);
}
