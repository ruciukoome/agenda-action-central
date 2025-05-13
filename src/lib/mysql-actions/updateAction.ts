
import { executeQuery } from '@/integrations/mysql/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/mysql/types';
import { ActionItem } from '@/types/action';

/**
 * Updates an existing action in the MySQL database
 * Table: actions
 */
export async function updateAction(action: Partial<ActionItem> & { id: string }, userId: string) {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!action.id) {
    throw new Error('Action ID is required');
  }

  const now = new Date().toISOString();
  
  // Build the query dynamically based on provided fields
  let query = 'UPDATE actions SET updated_at = ?';
  const params: any[] = [now];
  
  // Only update fields that are provided
  if (action.description !== undefined) {
    query += ', description = ?';
    params.push(action.description);
  }
  
  if (action.department !== undefined) {
    query += ', department = ?';
    params.push(action.department);
  }
  
  if (action.meetingDate !== undefined) {
    query += ', meeting_date = ?';
    params.push(action.meetingDate);
  }
  
  if (action.priority !== undefined) {
    query += ', priority = ?';
    params.push(action.priority);
  }
  
  if (action.ownerEmail !== undefined) {
    query += ', owner_email = ?';
    params.push(action.ownerEmail);
  }
  
  if (action.completed !== undefined) {
    query += ', completed = ?';
    params.push(action.completed ? 1 : 0);
  }
  
  if (action.progressStatus !== undefined) {
    query += ', progress_status = ?';
    params.push(action.progressStatus);
  }
  
  if (action.notes !== undefined) {
    query += ', notes = ?';
    params.push(action.notes);
  }
  
  if (action.dueDate !== undefined) {
    query += ', due_date = ?';
    params.push(action.dueDate);
  }
  
  // Add the WHERE clause for the ID and user_id (for security)
  query += ' WHERE id = ? AND user_id = ?';
  params.push(action.id, userId);
  
  try {
    const result = await executeQuery(query, params);
    
    // Check if the update was successful
    if ((result as any).affectedRows === 0) {
      throw new Error('Action not found or you do not have permission to update it');
    }
    
    // Fetch the updated record
    const fetchQuery = 'SELECT * FROM actions WHERE id = ? AND user_id = ?';
    const actions = await executeQuery<DbAction>(fetchQuery, [action.id, userId]);
    
    if (actions.length === 0) {
      throw new Error('Failed to retrieve updated action');
    }
    
    return mapDbActionToActionItem(actions[0]);
  } catch (error) {
    console.error('Error updating action:', error);
    throw error;
  }
}
