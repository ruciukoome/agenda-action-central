
import axios from 'axios';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { toast } from 'sonner';
import { updateAction as updateSupabaseAction } from '@/lib/actions';

export async function updateAction(
  actionId: string,
  actionData: Partial<ActionItem>,
  userId: string
): Promise<ActionItem> {
  try {
    let updatedAction: ActionItem;
    console.log('Starting update action process for:', actionId);
    
    // First try the PostgreSQL backend
    try {
      console.log('Attempting to update action via PostgreSQL API', { actionId, userId });
      
      // Send request to the backend API with a timeout
      const response = await axios.put(`http://localhost:5000/api/actions/${actionId}`, {
        action: { id: actionId, ...actionData },
        userId
      }, { 
        timeout: 3000 // Add a timeout to fail faster if the server is not running
      });
      
      // Map the database response to an ActionItem
      const dbAction = response.data as DbAction;
      updatedAction = mapDbActionToActionItem(dbAction);
      
      console.log('Action updated successfully in PostgreSQL:', updatedAction);
      
      // Show success toast
      toast.success("Action Updated", {
        description: `Successfully updated action: ${updatedAction.description.substring(0, 30)}...`
      });
      
      return updatedAction;
    } catch (postgresError) {
      console.error('PostgreSQL update failed, falling back to Supabase:', postgresError);
      
      // If the PostgreSQL server is not running, fall back to Supabase
      // First, fetch the complete action to combine with our updates
      try {
        // Import the Supabase fetchActions function
        const { fetchActions: fetchSupabaseActions } = await import('@/lib/actions/fetchActions');
        
        // Get all actions from Supabase
        const actions = await fetchSupabaseActions();
        
        // Find the action we're trying to update
        const existingAction = actions.find(action => action.id === actionId);
        
        if (existingAction) {
          // Merge the existing action with the updates
          console.log('Found existing action in Supabase, merging with updates');
          const fullActionData = { 
            ...existingAction, 
            ...actionData 
          };
          
          // Use the update function from Supabase actions
          try {
            updatedAction = await updateSupabaseAction(fullActionData);
            
            console.log('Action updated successfully via Supabase fallback:', updatedAction);
            
            // Show success toast
            toast.success("Action Updated", {
              description: `Successfully updated action using Supabase (fallback): ${updatedAction.description.substring(0, 30)}...`
            });
            
            return updatedAction;
          } catch (supabaseUpdateError: any) {
            console.error('Supabase update error:', supabaseUpdateError);
            if (supabaseUpdateError.message && supabaseUpdateError.message.includes('JSON object requested, multiple (or no) rows returned')) {
              throw new Error('Could not update action: Action not found or database constraint error.');
            }
            throw supabaseUpdateError;
          }
        } else {
          throw new Error('Could not find existing action in Supabase');
        }
      } catch (fallbackError) {
        console.error('Supabase fallback failed:', fallbackError);
        throw new Error(`Failed to update action: ${fallbackError.message}`);
      }
    }
  } catch (error) {
    console.error('Error updating action:', error);
    
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error("Failed to update action", {
      description: errorMessage
    });
    throw error;
  }
}
