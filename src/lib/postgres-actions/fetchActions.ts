
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
      console.log("Attempting to fetch actions from PostgreSQL API");
      const response = await axios.get(`http://localhost:5000/api/actions`, {
        params: { userId },
        timeout: 3000 // Add timeout to fail faster if server not running
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
      
      // Check if we already showed the fallback toast recently
      const lastShownTime = localStorage.getItem('postgres_fallback_toast_time');
      const currentTime = new Date().getTime();
      
      // Only show toast if it hasn't been shown in the last 30 seconds
      if (!lastShownTime || (currentTime - parseInt(lastShownTime)) > 30000) {
        // Show a toast notification about using Supabase as fallback
        toast.info("Using Supabase Data", {
          id: "postgres-fallback-toast", // Use a unique ID to prevent duplicate toasts
          description: "Could not connect to PostgreSQL. Showing actions from Supabase instead.",
          duration: 3000, // Shorter duration to minimize disruption
          position: "top-right"
        });
        
        // Store the time we showed this toast
        localStorage.setItem('postgres_fallback_toast_time', currentTime.toString());
      }
      
      // Import the Supabase fetchActions function
      const { fetchActions: fetchSupabaseActions } = await import('@/lib/actions/fetchActions');
      
      // Call the Supabase fetchActions function
      const actions = await fetchSupabaseActions();
      console.log(`Found ${actions.length} actions in Supabase`);
      
      return actions;
    }
  } catch (error) {
    console.error("Error fetching actions:", error);
    
    // Check if we already showed this error toast recently
    const lastErrorTime = localStorage.getItem('fetch_error_toast_time');
    const currentTime = new Date().getTime();
    
    // Only show error toast if it hasn't been shown in the last 30 seconds
    if (!lastErrorTime || (currentTime - parseInt(lastErrorTime)) > 30000) {
      toast.error("Failed to fetch actions", {
        id: "fetch-error-toast", // Use a consistent ID to prevent multiple similar toasts
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 3000
      });
      
      // Store the time we showed this error
      localStorage.setItem('fetch_error_toast_time', currentTime.toString());
    }
    
    // Return empty array instead of throwing to prevent page from breaking
    return [];
  }
}
