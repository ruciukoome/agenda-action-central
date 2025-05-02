
import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes an action from the database
 * Table: actions
 */
export async function deleteAction(id: string): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}
