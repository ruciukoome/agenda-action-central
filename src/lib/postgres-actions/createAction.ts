
import { executeQuery } from '@/integrations/postgres/client';
import { v4 as uuidv4 } from 'uuid';
import { DbAction, mapActionItemToDbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a new action in the PostgreSQL database
 * Table: actions
 */
export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActionItem> {
  // Get the authenticated user from Supabase
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Map the action to database format and add UUID
  const dbAction = mapActionItemToDbAction(action as ActionItem, userData.user.id);
  const id = uuidv4();
  const now = new Date().toISOString();
  
  // Build query
  const query = `
    INSERT INTO actions (
      id, description, department, meeting_date, priority, owner_email, completed, 
      progress_status, notes, user_id, created_at, updated_at, due_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    RETURNING *
  `;
  
  const params = [
    id, 
    dbAction.description,
    dbAction.department,
    dbAction.meeting_date,
    dbAction.priority,
    dbAction.owner_email,
    dbAction.completed,
    dbAction.progress_status,
    dbAction.notes,
    dbAction.user_id,
    now,
    now,
    dbAction.due_date || null
  ];
  
  try {
    const results = await executeQuery<DbAction>(query, params);
    
    if (results.length === 0) {
      throw new Error('Failed to create action');
    }
    
    return mapDbActionToActionItem(results[0]);
  } catch (error) {
    console.error('Error creating action:', error);
    throw error;
  }
}
