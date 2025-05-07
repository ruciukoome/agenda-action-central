
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

export default function ManagedActions() {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pass a user ID for PostgreSQL - in a real app, get this from auth context
      const userId = localStorage.getItem("USER_ID") || "test-user-id";
      const data = await fetchActions(userId);
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
  }, []);

  useEffect(() => {
    loadActions();
    
    // Set up polling for data refresh every 30 seconds
    // This replaces Supabase's realtime functionality
    const intervalId = setInterval(() => {
      loadActions();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadActions]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Actions</h1>
        <ManagedActionsContent actions={actions} isLoading={isLoading} />
      </div>
    </div>
  );
}
