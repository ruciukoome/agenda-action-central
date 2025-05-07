
import { executeQuery } from '@/integrations/postgres/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';

export async function updateAction(
  actionId: string,
  actionData: Partial<ActionItem>,
  userId: string
): Promise<ActionItem> {
  try {
    // Build the SET clause dynamically based on what fields are provided
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (actionData.description !== undefined) {
      updateFields.push(`description = $${paramCounter++}`);
      values.push(actionData.description);
    }
    
    if (actionData.department !== undefined) {
      updateFields.push(`department = $${paramCounter++}`);
      values.push(actionData.department);
    }
    
    if (actionData.meetingDate !== undefined) {
      updateFields.push(`meeting_date = $${paramCounter++}`);
      values.push(actionData.meetingDate);
    }
    
    if (actionData.priority !== undefined) {
      updateFields.push(`priority = $${paramCounter++}`);
      values.push(actionData.priority);
    }
    
    if (actionData.ownerEmail !== undefined) {
      updateFields.push(`owner_email = $${paramCounter++}`);
      values.push(actionData.ownerEmail);
    }
    
    if (actionData.completed !== undefined) {
      updateFields.push(`completed = $${paramCounter++}`);
      values.push(actionData.completed);
    }
    
    if (actionData.progressStatus !== undefined) {
      updateFields.push(`progress_status = $${paramCounter++}`);
      values.push(actionData.progressStatus);
    }
    
    if (actionData.notes !== undefined) {
      updateFields.push(`notes = $${paramCounter++}`);
      values.push(actionData.notes);
    }
    
    if (actionData.dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCounter++}`);
      values.push(actionData.dueDate);
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramCounter++}`);
    values.push(new Date().toISOString());
    
    // Add the action ID and user ID to the values array
    values.push(actionId);
    values.push(userId);
    
    // Build and execute the query
    const query = `
      UPDATE actions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter++} AND user_id = $${paramCounter++}
      RETURNING *
    `;
    
    const result = await executeQuery<DbAction>(query, values);
    
    if (result.length === 0) {
      throw new Error('Action not found or you do not have permission to update it');
    }
    
    // Map the DB action to an ActionItem and return it
    return mapDbActionToActionItem(result[0]);
  } catch (error) {
    console.error('Error updating action in PostgreSQL:', error);
    throw error;
  }
}
