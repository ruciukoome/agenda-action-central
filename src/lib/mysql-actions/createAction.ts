
import { executeQuery } from '@/integrations/mysql/client';
import { v4 as uuidv4 } from 'uuid';
import { DbAction, mapActionItemToDbAction, mapDbActionToActionItem } from '@/integrations/mysql/types';

/**
 * Creates a new action in the MySQL database
 * Table: actions
 */
export async function createAction(action: any, userId: string) {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Map the action to database format and add UUID
  const dbAction = mapActionItemToDbAction(action, userId);
  const id = uuidv4();
  const now = new Date().toISOString();
  
  // Build query
  const query = `
    INSERT INTO actions (
      id, description, department, meeting_date, priority, owner_email, completed, 
      progress_status, notes, user_id, created_at, updated_at, due_date
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;
  
  const params = [
    id, 
    dbAction.description,
    dbAction.department,
    dbAction.meeting_date,
    dbAction.priority,
    dbAction.owner_email,
    dbAction.completed ? 1 : 0, // MySQL uses 1/0 for booleans
    dbAction.progress_status,
    dbAction.notes,
    dbAction.user_id,
    now,
    now,
    dbAction.due_date || null
  ];
  
  try {
    await executeQuery(query, params);
    
    // Fetch the created record to return
    const fetchQuery = 'SELECT * FROM actions WHERE id = ?';
    const results = await executeQuery<DbAction>(fetchQuery, [id]);
    
    if (results.length === 0) {
      throw new Error('Failed to create action');
    }
    
    return mapDbActionToActionItem(results[0]);
  } catch (error) {
    console.error('Error creating action:', error);
    throw error;
  }
}
