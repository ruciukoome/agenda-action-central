
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapDatabaseActionToActionItem, mapActionItemToDatabaseAction } from "@/lib/mappers";

export async function fetchActions() {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data.map(mapDatabaseActionToActionItem);
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('actions')
    .insert([mapActionItemToDatabaseAction(action)])
    .select()
    .single();
    
  if (error) throw error;
  return mapDatabaseActionToActionItem(data);
}

export async function updateAction(action: ActionItem) {
  const { data, error } = await supabase
    .from('actions')
    .update(mapActionItemToDatabaseAction(action))
    .eq('id', action.id)
    .select()
    .single();
    
  if (error) throw error;
  return mapDatabaseActionToActionItem(data);
}

export async function deleteAction(id: string) {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  return supabase
    .channel('actions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'actions'
      },
      (payload) => {
        // Make sure payload.new contains all required fields before mapping
        if (payload.new && 
            typeof payload.new === 'object' && 
            'id' in payload.new && 
            'description' in payload.new &&
            'department' in payload.new &&
            'meeting_date' in payload.new &&
            'priority' in payload.new &&
            'owner_email' in payload.new &&
            'progress_status' in payload.new) {
          // Use type assertion since we've verified the essential properties exist
          const databaseAction = payload.new as {
            id: string;
            description: string;
            department: string;
            meeting_date: string;
            priority: string;
            owner_email: string;
            completed: boolean;
            progress_status: string;
            notes: string;
            created_at: string;
            updated_at: string;
            due_date?: string;
            created_by: string;
          };
          
          callback(mapDatabaseActionToActionItem(databaseAction));
        } else {
          console.error('Received incomplete payload:', payload);
        }
      }
    )
    .subscribe();
}
