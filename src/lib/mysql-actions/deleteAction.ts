
import { executeQuery } from '@/integrations/mysql/client';

/**
 * Deletes an action from the MySQL database
 * Table: actions
 */
export async function deleteAction(id: string, userId: string) {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const query = 'DELETE FROM actions WHERE id = ? AND user_id = ?';
  
  try {
    const result = await executeQuery(query, [id, userId]);
    
    // Check if the deletion was successful
    if ((result as any).affectedRows === 0) {
      throw new Error('Action not found or you do not have permission to delete it');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}
