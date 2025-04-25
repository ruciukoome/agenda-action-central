import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapDatabaseActionToActionItem, mapActionItemToDatabaseAction } from "@/lib/mappers";
import { toast } from "@/components/ui/use-toast";

export async function fetchActions() {
  try {
    console.log("Fetching actions from database");
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching actions:", error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data.length} actions`);
    return data.map(mapDatabaseActionToActionItem);
  } catch (error) {
    console.error("Failed to fetch actions:", error);
    toast({
      title: "Error fetching actions",
      description: "Please try refreshing the page.",
      variant: "destructive",
    });
    throw error;
  }
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    console.log("Creating new action:", action.description);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create actions.",
        variant: "destructive",
      });
      throw new Error('User must be authenticated to create actions');
    }

    console.log("User authenticated, proceeding with action creation");
    const { data, error } = await supabase
      .from('actions')
      .insert([{
        ...mapActionItemToDatabaseAction(action),
        created_by: session.user.id
      }])
      .select()
      .single();
      
    if (error) {
      console.error("Error creating action:", error);
      throw error;
    }
    
    console.log("Action created successfully:", data.id);
    return mapDatabaseActionToActionItem(data);
  } catch (error) {
    console.error("Failed to create action:", error);
    toast({
      title: "Error creating action",
      description: "Please try again.",
      variant: "destructive",
    });
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
      throw error;
    }
    
    console.log("Action updated successfully");
    return mapDatabaseActionToActionItem(data);
  } catch (error) {
    console.error("Failed to update action:", error);
    toast({
      title: "Error updating action",
      description: "Please try again.",
      variant: "destructive",
    });
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
      throw error;
    }
    
    console.log("Action deleted successfully");
  } catch (error) {
    console.error("Failed to delete action:", error);
    toast({
      title: "Error deleting action",
      description: "Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  console.log("Setting up realtime subscription for actions");
  
  try {
    const promise = supabase.rpc(
      'supabase_realtime.enable_changes', 
      { table_name: 'actions' } as any
    );
    
    promise.then(() => console.log("Realtime changes enabled for actions table"))
      .catch(error => console.error("Failed to enable realtime changes:", error));
  } catch (error) {
    console.error("Exception enabling realtime changes:", error);
  }
    
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
        console.log("Received realtime payload:", payload.eventType);
        if (payload.new && 
            typeof payload.new === 'object' && 
            'id' in payload.new && 
            'description' in payload.new &&
            'department' in payload.new &&
            'meeting_date' in payload.new &&
            'priority' in payload.new &&
            'owner_email' in payload.new &&
            'progress_status' in payload.new) {
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
          
          console.log("Mapped action for callback:", databaseAction.id);
          callback(mapDatabaseActionToActionItem(databaseAction));
        } else {
          console.error('Received incomplete payload:', payload);
        }
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}
