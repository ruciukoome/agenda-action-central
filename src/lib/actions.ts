
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapDatabaseActionToActionItem, mapActionItemToDatabaseAction } from "@/lib/mappers";

export async function fetchActions() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Authentication error:", sessionError);
    throw sessionError;
  }

  if (!sessionData.session) {
    console.error("No active session found");
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching actions:", error);
    throw error;
  }
  
  return data.map(mapDatabaseActionToActionItem);
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session) {
    throw new Error("Authentication required");
  }
  
  const actionWithCreator = {
    ...mapActionItemToDatabaseAction(action),
    created_by: sessionData.session.user.id
  };
  
  const { data, error } = await supabase
    .from('actions')
    .insert([actionWithCreator])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating action:", error);
    throw error;
  }
  
  return mapDatabaseActionToActionItem(data);
}

export async function updateAction(action: ActionItem) {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session) {
    throw new Error("Authentication required");
  }
  
  const { data, error } = await supabase
    .from('actions')
    .update(mapActionItemToDatabaseAction(action))
    .eq('id', action.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating action:", error);
    throw error;
  }
  
  return mapDatabaseActionToActionItem(data);
}

export async function deleteAction(id: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session) {
    throw new Error("Authentication required");
  }
  
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Error deleting action:", error);
    throw error;
  }
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
