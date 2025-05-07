
import { executeQuery } from "@/integrations/postgres/client";
import { ActionItem } from "@/types/action";
import { DbAction } from "@/integrations/postgres/types";

/**
 * Fetches actions from the PostgreSQL database
 * @param userId The user ID to fetch actions for
 * @returns Array of ActionItem objects
 */
export async function fetchActions(userId?: string): Promise<ActionItem[]> {
  try {
    if (!userId) {
      console.warn("No user ID provided to fetchActions, using default");
      userId = "test-user-id";
    }
    
    const query = `
      SELECT * FROM actions 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const actions = await executeQuery<DbAction>(query, [userId]);
    
    // Map database objects to ActionItem format
    return actions.map(action => ({
      id: action.id,
      description: action.description,
      department: action.department,
      meetingDate: action.meeting_date,
      priority: action.priority,
      ownerEmail: action.owner_email,
      completed: action.completed,
      progressStatus: action.progress_status,
      notes: action.notes || '',
      createdAt: action.created_at,
      updatedAt: action.updated_at,
      dueDate: action.due_date || null,
    }));
  } catch (error) {
    console.error("PostgreSQL fetchActions error:", error);
    throw new Error(`Failed to fetch actions: ${(error as Error).message}`);
  }
}
