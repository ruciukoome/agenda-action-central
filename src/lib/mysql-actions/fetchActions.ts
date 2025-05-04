
import { executeQuery } from '@/integrations/mysql/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/mysql/types';

/**
 * Fetches all actions from the MySQL database
 * Table: actions
 */
export async function fetchActions() {
  const query = `
    SELECT * FROM actions 
    ORDER BY created_at DESC
  `;
  
  try {
    const actions = await executeQuery<DbAction>(query);
    return actions.map(action => mapDbActionToActionItem(action));
  } catch (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }
}
