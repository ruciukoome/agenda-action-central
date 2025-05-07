
import { executeQuery } from '@/integrations/postgres/client';
import { supabase } from '@/integrations/supabase/client';

/**
 * Deletes an action from the PostgreSQL database
 * Table: actions
 */
export async function deleteAction(id: string): Promise<void> {
  // Get the authenticated user from Supabase
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const query = 'DELETE FROM actions WHERE id = $1 AND user_id = $2';
  
  try {
    const result = await executeQuery(query, [id, userData.user.id]);
    
    if ((result as any).rowCount === 0) {
      throw new Error('Action not found or you do not have permission to delete it');
    }
  } catch (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}
