
import axios from 'axios';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { toast } from 'sonner';

export async function createAction(
  action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<ActionItem> {
  try {
    console.log('Creating action in PostgreSQL:', action);
    
    // Send request to the backend API
    const response = await axios.post('http://localhost:5000/api/actions', {
      action,
      userId
    });
    
    // Map the database response to an ActionItem
    const dbAction = response.data as DbAction;
    const createdAction = mapDbActionToActionItem(dbAction);
    
    console.log('Action created successfully in PostgreSQL:', createdAction);
    
    // Show success toast
    toast.success("Action Created", {
      description: `Successfully created action: ${action.description.substring(0, 30)}...`
    });
    
    return createdAction;
  } catch (error) {
    console.error('Error creating action in PostgreSQL:', error);
    
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error("Failed to create action", {
      description: errorMessage
    });
    throw error;
  }
}
