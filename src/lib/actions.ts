
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapDatabaseActionToActionItem, mapActionItemToDatabaseAction } from "@/lib/mappers";
import { toast } from "@/hooks/use-toast";

export async function fetchActions() {
  try {
    console.log("Fetching actions from database...");
    
    // Ensure user is authenticated before fetching
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No active session found, user must be authenticated to fetch actions");
      throw new Error("Authentication required to access actions");
    }
    
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching actions:", error);
      toast({
        title: "Error fetching actions",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log("Actions fetched successfully:", data?.length || 0, "actions found");
    return data ? data.map(mapDatabaseActionToActionItem) : [];
  } catch (error) {
    console.error("Unexpected error when fetching actions:", error);
    throw error;
  }
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    console.log("Creating new action:", action);
    
    // Get the current user to set as created_by
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No user ID found for action creation");
      throw new Error("You must be logged in to create actions");
    }
    
    const actionData = {
      ...mapActionItemToDatabaseAction(action),
      created_by: userId
    };
    
    const { data, error } = await supabase
      .from('actions')
      .insert([actionData])
      .select()
      .single();
      
    if (error) {
      console.error("Error creating action:", error);
      toast({
        title: "Error creating action",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log("Action created successfully:", data);
    return mapDatabaseActionToActionItem(data);
  } catch (error) {
    console.error("Unexpected error when creating action:", error);
    throw error;
  }
}

export async function updateAction(action: ActionItem) {
  try {
    console.log("Updating action:", action.id);
    const { data, error } = await supabase
      .from('actions')
      .update(mapActionItemToDatabaseAction(action))
      .eq('id', action.id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating action:", error);
      toast({
        title: "Error updating action",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log("Action updated successfully");
    return mapDatabaseActionToActionItem(data);
  } catch (error) {
    console.error("Unexpected error when updating action:", error);
    throw error;
  }
}

export async function deleteAction(id: string) {
  try {
    console.log("Deleting action:", id);
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error deleting action:", error);
      toast({
        title: "Error deleting action",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log("Action deleted successfully");
  } catch (error) {
    console.error("Unexpected error when deleting action:", error);
    throw error;
  }
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  console.log("Setting up real-time subscription for actions...");
  
  const channel = supabase
    .channel('actions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'actions'
      },
      (payload) => {
        console.log("Received real-time update:", payload);
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
          
          const mappedAction = mapDatabaseActionToActionItem(databaseAction);
          console.log("Mapped action for real-time update:", mappedAction);
          callback(mappedAction);
        } else {
          console.error('Received incomplete payload:', payload);
        }
      }
    )
    .subscribe((status) => {
      console.log("Real-time subscription status:", status);
    });
    
  return channel;
}
