
import { executeQuery } from '@/integrations/postgres/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';

/**
 * Fetches all actions from the PostgreSQL database
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
