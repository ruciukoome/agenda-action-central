
import axios from 'axios';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { toast } from 'sonner';

export async function updateAction(
  actionId: string,
  actionData: Partial<ActionItem>,
  userId: string
): Promise<ActionItem> {
  try {
    // Send request to the backend API
    const response = await axios.put(`http://localhost:5000/api/actions/${actionId}`, {
      action: { id: actionId, ...actionData },
      userId
    });
    
    // Map the database response to an ActionItem
    const dbAction = response.data as DbAction;
    const updatedAction = mapDbActionToActionItem(dbAction);
    
    console.log('Action updated successfully in PostgreSQL:', updatedAction);
    
    // Show success toast
    toast.success("Action Updated", {
      description: `Successfully updated action: ${updatedAction.description.substring(0, 30)}...`
    });
    
    return updatedAction;
  } catch (error) {
    console.error('Error updating action in PostgreSQL:', error);
    
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
