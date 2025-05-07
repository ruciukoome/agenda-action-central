
import { executeQuery } from '@/integrations/postgres/client';

export async function deleteAction(
  actionId: string,
  userId: string
): Promise<void> {
  try {
    const query = `
      DELETE FROM actions 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await executeQuery(query, [actionId, userId]);
    
    if ((result as any).rowCount === 0) {
      throw new Error('Action not found or you do not have permission to delete it');
    }
  } catch (error) {
    console.error('Error deleting action from PostgreSQL:', error);
    throw error;
  }
}
