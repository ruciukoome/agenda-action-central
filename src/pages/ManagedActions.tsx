/**
 * ACTIONS MANAGEMENT PAGE
 */

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { fetchActions } from "@/lib/postgres-actions";
import { toast } from "@/lib/toast-wrapper";
import { ManagedActionsContent } from "@/components/actions/ManagedActionsContent";

export default function ManagedActions() {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("USER_ID") || "test-user-id";
      const data = await fetchActions(userId);
      setActions(data);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
      toast.error("Error fetching actions", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActions();
    const intervalId = setInterval(() => {
      loadActions();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadActions]);

  return (
    <AppLayout title="Manage Actions">
      <div className="container py-6">
        <ManagedActionsContent actions={actions} isLoading={isLoading} onActionUpdated={loadActions} />
      </div>
    </AppLayout>
  );
}
