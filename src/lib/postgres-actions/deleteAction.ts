
import axios from 'axios';
import { toast } from 'sonner';
import { deleteAction as deleteSupabaseAction } from '@/lib/actions';

export async function deleteAction(
  actionId: string,
  userId: string
): Promise<void> {
  try {
    console.log('Starting delete action process for:', actionId);

    // First try the PostgreSQL backend
    try {
      console.log('Attempting to delete action via PostgreSQL API', { actionId, userId });
      
      // Send request to the backend API
      await axios.delete(`http://localhost:5000/api/actions/${actionId}`, {
        params: { userId },
        timeout: 3000 // Add a timeout to fail faster if the server is not running
      });
      
      console.log('Action deleted successfully in PostgreSQL:', actionId);
      
      // Show success toast
      toast.success("Action Deleted", {
        description: "Successfully deleted action"
      });

      return; // Exit early if PostgreSQL deletion succeeded
    } catch (postgresError) {
      console.error('PostgreSQL deletion failed, falling back to Supabase:', postgresError);
      
      // If the PostgreSQL server is not running, fall back to Supabase
      await deleteSupabaseAction(actionId);
      
      console.log('Action deleted successfully via Supabase fallback:', actionId);
      
      // Show success toast with fallback info
      toast.success("Action Deleted", {
        description: "Successfully deleted action using Supabase (fallback)"
      });
    }
  } catch (error) {
    console.error('Error deleting action:', error);
    
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error("Failed to delete action", {
      description: errorMessage
    });
    throw error;
  }
}
