
import { executeQuery } from '@/integrations/postgres/client';
import { DbAction, mapDbActionToActionItem } from '@/integrations/postgres/types';
import { ActionItem } from '@/types/action';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export async function createAction(
  action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<ActionItem> {
  try {
    console.log('Creating action in PostgreSQL:', action);
    const now = new Date().toISOString();
    const actionId = uuidv4();
    
    const query = `
      INSERT INTO actions (
        id,
        description,
        department,
        meeting_date,
        priority,
        owner_email,
        completed,
        progress_status,
        notes,
        created_at,
        updated_at,
        due_date,
        user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      actionId,
      action.description,
      action.department,
      action.meetingDate,
      action.priority,
      action.ownerEmail,
      action.completed || false,
      action.progressStatus || 'Not Started',
      action.notes || '',
      now,
      now,
      action.dueDate || null,
      userId
    ];
    
    try {
      const result = await executeQuery<DbAction>(query, values);
      
      if (result.length === 0) {
        throw new Error('Failed to create action item');
      }
      
      // Map the DB action to an ActionItem and return it
      const createdAction = mapDbActionToActionItem(result[0]);
      console.log('Action created successfully in PostgreSQL:', createdAction);
      
      // Show success toast
      toast.success("Action Created", {
        description: `Successfully created action: ${action.description.substring(0, 30)}...`
      });
      
      return createdAction;
    } catch (error) {
      console.error('Error in PostgreSQL query:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating action in PostgreSQL:', error);
    toast.error("Failed to create action", {
      description: (error as Error).message
    });
    throw error;
  }
}
