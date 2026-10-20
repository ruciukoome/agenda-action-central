/**
 * ACTIONS MANAGEMENT PAGE
 */

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/primitives";
import { fetchActions } from "@/lib/actions";
import { toast } from "@/lib/toast-wrapper";
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
      <PageContainer>
        <ManagedActionsContent actions={actions} isLoading={isLoading} onActionUpdated={loadActions} />
      </PageContainer>
    </AppLayout>
  );
}
