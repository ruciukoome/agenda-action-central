
import axios from 'axios';
import { ActionItem } from "@/types/action";
import { DbAction } from "@/integrations/postgres/types";
import { toast } from "sonner";
import { loadCredentialsFromStorage } from '@/integrations/postgres/client';

/**
 * Fetches actions from the PostgreSQL database via the API
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
    
    // Load credentials to use in API request
    loadCredentialsFromStorage();
    
    // Attempt to connect to PostgreSQL API and fetch actions
    try {
      const response = await axios.get(`http://localhost:5000/api/actions`, {
        params: { userId }
      });
      
      const actions = response.data;
      console.log(`Found ${actions.length} actions via PostgreSQL API`);
      
      // Map database objects to ActionItem format
      return actions.map((action: DbAction) => ({
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
      console.error("PostgreSQL API fetchActions error:", error);
      
      // If we failed to fetch from PostgreSQL API, try to fetch from Supabase as fallback
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
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to fetch actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
