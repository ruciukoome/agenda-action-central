
import axios from 'axios';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { toast } from 'sonner';
import { createAction as createSupabaseAction } from '@/lib/actions';

export async function createAction(
  action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<ActionItem> {
  try {
    console.log('Creating action with data:', JSON.stringify(action, null, 2));
    
    // Ensure dueDate is properly formatted if it exists
    const actionWithFormattedDate = {
      ...action,
      // Make sure due date is preserved exactly as passed
      dueDate: action.dueDate ? action.dueDate : undefined
    };
    
    console.log('Creating action in PostgreSQL with formatted date:', 
      actionWithFormattedDate.dueDate ? new Date(actionWithFormattedDate.dueDate).toISOString() : 'No due date');
    
    try {
      // Send request to the backend API with a timeout
      const response = await axios.post('http://localhost:5000/api/actions', {
        action: actionWithFormattedDate,
        userId
      }, {
        timeout: 5000 // Add a timeout to fail faster if the server is not running
      });
      
      // Log the raw response data to see exactly what's returned
      console.log('Raw PostgreSQL response:', JSON.stringify(response.data, null, 2));
      
      // Map the database response to an ActionItem
      const dbAction = response.data as DbAction;
      const createdAction = mapDbActionToActionItem(dbAction);
      
      console.log('Action created successfully in PostgreSQL:', createdAction);
      console.log('Due date in created action:', createdAction.dueDate || "Not set");
      
      // Show success toast
      toast.success("Action Created", {
        description: `Successfully created action: ${action.description.substring(0, 30)}...`
      });
      
      return createdAction;
    } catch (postgresError) {
      console.error('PostgreSQL creation failed, falling back to Supabase:', postgresError);
      
      // If the PostgreSQL server is not running, fall back to Supabase
      const createdAction = await createSupabaseAction(actionWithFormattedDate as ActionItem);
      
      console.log('Action created successfully via Supabase fallback:', createdAction);
      console.log('Due date in created action (Supabase fallback):', createdAction.dueDate || "Not set");
      
      // Show success toast with fallback info
      toast.success("Action Created", {
        description: `Successfully created action using Supabase (fallback): ${action.description.substring(0, 30)}...`
      });
      
      return createdAction;
    }
  } catch (error) {
    console.error('Error creating action:', error);
    
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
