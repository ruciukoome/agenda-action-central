
import { executeQuery } from "@/integrations/postgres/client";
import { ActionItem } from "@/types/action";
import { DbAction } from "@/integrations/postgres/types";
import { toast } from "sonner";

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
    
    console.log("Fetching actions for user:", userId);
    
    // Attempt to connect to PostgreSQL and fetch actions
    try {
      const query = `
        SELECT * FROM actions 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      
      // Execute the query
      const actions = await executeQuery<DbAction>(query, [userId]);
      console.log(`Found ${actions.length} actions in PostgreSQL`);
      
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
      
      // If we failed to fetch from PostgreSQL, try to fetch from Supabase as fallback
      console.log("Falling back to Supabase for fetching actions");
      
      // Import the Supabase fetchActions function
      const { fetchActions: fetchSupabaseActions } = await import('@/lib/actions/fetchActions');
      
      // Call the Supabase fetchActions function
      const actions = await fetchSupabaseActions();
      console.log(`Found ${actions.length} actions in Supabase`);
      
      // Show a toast notification about using Supabase as fallback
      if (actions.length > 0) {
        toast.info("Using Supabase Data", {
          description: "Could not connect to PostgreSQL. Showing actions from Supabase instead."
        });
      }
      
      return actions;
    }
  } catch (error) {
    console.error("Error fetching actions:", error);
    toast.error("Failed to fetch actions", {
      description: (error as Error).message
    });
    throw new Error(`Failed to fetch actions: ${(error as Error).message}`);
  }
}
