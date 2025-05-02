
/**
 * ACTIONS MANAGEMENT PAGE
 * ---------------------
 * Provides interface for viewing, filtering, and managing actions
 * 
 * Backend connections:
 * - Fetches actions from the database via fetchActions()
 * - Handles deleting actions via deleteAction()
 * - Sets up real-time subscription to action changes
 */

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { fetchActions } from "@/lib/actions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ManagedActionsContent } from "@/components/actions/ManagedActionsContent";

export default function ManagedActions() {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchActions();
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

    // Set up realtime subscription
    const channel = supabase
      .channel('actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions'
        },
        () => {
          loadActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
