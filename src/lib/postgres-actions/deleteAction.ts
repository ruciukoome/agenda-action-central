
import axios from 'axios';
import { toast } from 'sonner';

export async function deleteAction(
  actionId: string,
  userId: string
): Promise<void> {
  try {
    // Send request to the backend API
    await axios.delete(`http://localhost:5000/api/actions/${actionId}`, {
      params: { userId }
    });
    
    console.log('Action deleted successfully in PostgreSQL:', actionId);
    
    // Show success toast
    toast.success("Action Deleted", {
      description: "Successfully deleted action"
    });
  } catch (error) {
    console.error('Error deleting action from PostgreSQL:', error);
    
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
