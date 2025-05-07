
import { executeQuery } from '@/integrations/postgres/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';

export async function fetchActions(userId: string, filters?: Record<string, any>): Promise<ActionItem[]> {
  try {
    let whereClause = 'WHERE user_id = $1';
    let queryParams = [userId];
    let paramCount = 2;
    
    // Apply filters if provided
    if (filters) {
      if (filters.ownerEmail) {
        whereClause += ` AND owner_email = $${paramCount++}`;
        queryParams.push(filters.ownerEmail);
      }
      
      if (filters.department) {
        whereClause += ` AND department = $${paramCount++}`;
        queryParams.push(filters.department);
      }
      
      if (filters.priority) {
        whereClause += ` AND priority = $${paramCount++}`;
        queryParams.push(filters.priority);
      }
      
      if (filters.completed !== undefined) {
        whereClause += ` AND completed = $${paramCount++}`;
        queryParams.push(filters.completed);
      }
      
      if (filters.progressStatus) {
        whereClause += ` AND progress_status = $${paramCount++}`;
        queryParams.push(filters.progressStatus);
      }
      
      if (filters.dueDateStart) {
        whereClause += ` AND due_date >= $${paramCount++}`;
        queryParams.push(filters.dueDateStart);
      }
      
      if (filters.dueDateEnd) {
        whereClause += ` AND due_date <= $${paramCount++}`;
        queryParams.push(filters.dueDateEnd);
      }
      
      if (filters.meetingDateStart) {
        whereClause += ` AND meeting_date >= $${paramCount++}`;
        queryParams.push(filters.meetingDateStart);
      }
      
      if (filters.meetingDateEnd) {
        whereClause += ` AND meeting_date <= $${paramCount++}`;
        queryParams.push(filters.meetingDateEnd);
      }
    }
    
    const query = `
      SELECT * FROM actions
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const results = await executeQuery<DbAction>(query, queryParams);
    
    // Map the DB actions to ActionItems
    return results.map(mapDbActionToActionItem);
  } catch (error) {
    console.error('Error fetching actions from PostgreSQL:', error);
    throw error;
  }
}

export async function fetchActionById(
  actionId: string,
  userId: string
): Promise<ActionItem | null> {
  try {
    const query = `
      SELECT * FROM actions
      WHERE id = $1 AND user_id = $2
    `;
    
    const results = await executeQuery<DbAction>(query, [actionId, userId]);
    
    if (results.length === 0) {
      return null;
    }
    
    return mapDbActionToActionItem(results[0]);
  } catch (error) {
    console.error('Error fetching action by ID from PostgreSQL:', error);
    throw error;
  }
}
