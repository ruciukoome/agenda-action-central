
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
    } catch (postgresError) {
      console.error('PostgreSQL update failed, falling back to Supabase:', postgresError);
      
      // If the PostgreSQL server is not running, fall back to Supabase
      // We need to ensure we're passing a complete ActionItem to the updateSupabaseAction function
      // First, try to fetch the complete action to combine with our updates
      try {
        // Import the Supabase fetchActions function
        const { fetchActions: fetchSupabaseActions } = await import('@/lib/actions/fetchActions');
        
        // Get all actions from Supabase
        const actions = await fetchSupabaseActions();
        
        // Find the action we're trying to update
        const existingAction = actions.find(action => action.id === actionId);
        
        if (existingAction) {
          // Merge the existing action with the updates
          updatedAction = await updateSupabaseAction({ 
            ...existingAction, 
            ...actionData 
          });
        } else {
          // If we can't find the action, we might not have all required fields
          // Check if actionData contains all required fields for ActionItem
          if (!isCompleteActionItem(actionData)) {
            throw new Error('Cannot update action: Missing required fields and could not find existing action');
          }
          
          // If actionData is complete, use it directly
          updatedAction = await updateSupabaseAction({ 
            id: actionId, 
            ...actionData as ActionItem 
          });
        }
      } catch (fetchError) {
        console.error('Failed to fetch existing action, trying direct update:', fetchError);
        
        // Last resort - if actionData contains all required fields, use it directly
        if (isCompleteActionItem(actionData)) {
          updatedAction = await updateSupabaseAction({ 
            id: actionId, 
            ...actionData as ActionItem 
          });
        } else {
          throw new Error('Cannot update action: Missing required fields and could not fetch existing action');
        }
      }
      
      console.log('Action updated successfully via Supabase fallback:', updatedAction);
      
      // Show success toast with fallback info
      toast.success("Action Updated", {
        description: `Successfully updated action using Supabase (fallback): ${updatedAction.description.substring(0, 30)}...`
      });
    }
    
    return updatedAction;
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

// Helper function to check if an object has all required ActionItem properties
function isCompleteActionItem(obj: Partial<ActionItem>): boolean {
  const requiredFields: (keyof ActionItem)[] = [
    'id', 'description', 'department', 'meetingDate', 'priority', 
    'ownerEmail', 'completed', 'progressStatus', 'notes', 'createdAt', 'updatedAt'
  ];
  
  return requiredFields.every(field => obj[field] !== undefined);
}
