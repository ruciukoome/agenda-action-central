
/**
 * ACTIONS MANAGEMENT PAGE
 * ---------------------
 * Provides interface for viewing, filtering, and managing actions
 * 
 * Backend connections:
 * - Fetches actions from the PostgreSQL database via fetchActions()
 * - Handles deleting actions via deleteAction()
 */

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { fetchActions } from "@/lib/postgres-actions";
import { toast } from "@/components/ui/use-toast";
import { ManagedActionsContent } from "@/components/actions/ManagedActionsContent";
import { useAuth } from "@/lib/auth";
import { DatabaseEnvironmentWarning } from "@/components/DatabaseEnvironmentWarning";

export default function ManagedActions() {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchActions(session?.user?.id);
      setActions(data);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
      toast({
        title: "Error fetching actions",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      loadActions();
    }
    
    // Set up polling for data refresh every 30 seconds
    // This replaces Supabase's realtime functionality
    const intervalId = setInterval(() => {
      if (session?.user) {
        loadActions();
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadActions, session]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Actions</h1>
        
        {/* Show warning when in browser environment */}
        {typeof window !== 'undefined' && <DatabaseEnvironmentWarning />}
        
        <ManagedActionsContent actions={actions} isLoading={isLoading} />
      </div>
    </div>
  );
}
