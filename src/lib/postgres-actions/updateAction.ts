
import { executeQuery } from '@/integrations/postgres/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { supabase } from '@/integrations/supabase/client';

/**
 * Updates an existing action in the PostgreSQL database
 * Table: actions
 */
export async function updateAction(action: ActionItem): Promise<ActionItem> {
  // Get the authenticated user from Supabase
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const now = new Date().toISOString();
  
  const query = `
    UPDATE actions 
    SET 
      description = $1,
      department = $2,
      meeting_date = $3,
      priority = $4,
      owner_email = $5,
      completed = $6,
      progress_status = $7,
      notes = $8,
      updated_at = $9,
      due_date = $10
    WHERE id = $11 AND user_id = $12
    RETURNING *
  `;
  
  const params = [
    action.description,
    action.department,
    action.meetingDate,
    action.priority,
    action.ownerEmail,
    action.completed,
    action.progressStatus,
    action.notes,
    now,
    action.dueDate || null,
    action.id,
    userData.user.id
  ];
  
  try {
    const results = await executeQuery<DbAction>(query, params);
    
    if (results.length === 0) {
      throw new Error('Action not found or you do not have permission to update it');
    }
    
    return mapDbActionToActionItem(results[0]);
  } catch (error) {
    console.error('Error updating action:', error);
    throw error;
  }
}
