
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

  // We need to exclude user_id from the update to prevent overwriting it
  const { user_id, ...dbActionWithoutUserId } = mapActionItemToDbAction(action, userData.user.id);

  // First, verify the action exists and belongs to this user
  const { data: existingAction, error: checkError } = await supabase
    .from('actions')
    .select('id')
    .eq('id', action.id)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking action existence:', checkError);
    throw checkError;
  }

  if (!existingAction) {
    throw new Error('Action not found or you do not have permission to update it');
  }

  // Proceed with update now that we've verified the action exists
  const { data, error } = await supabase
    .from('actions')
    .update(dbActionWithoutUserId as any)
    .eq('id', action.id)
    .eq('user_id', userData.user.id)  // Ensure we only update user's own records
    .select()
    .single();

  if (error) {
    console.error('Error updating action:', error);
    throw error;
  }

  return mapDbActionToActionItem(data as DbAction);
}
