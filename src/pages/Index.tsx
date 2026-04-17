/**
 * MAIN APPLICATION PAGE
 * -------------------
 * Displays the action dashboard and handles data loading
 * Scoped to the user's organization
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions } from "@/lib/postgres-actions";
import { toast } from "@/lib/toast-wrapper";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { ChartPieIcon } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { organization } = useOrganization();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const loadActions = async () => {
      setIsLoading(true);
      try {
        const userId = localStorage.getItem("USER_ID") || "test-user-id";
        const data = await fetchActions(userId);
        setActions(data);
      } catch (error) {
        console.error("Failed to fetch actions:", error);
        toast.error("Error fetching actions", {
          description: "Please refresh the page to try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadActions();
    const intervalId = setInterval(() => loadActions(), 30000);
    return () => clearInterval(intervalId);
  }, [session, navigate, organization]);

  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };

  return (
    <AppLayout
      title="Action Items"
      actions={
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2"
        >
          <ChartPieIcon className="h-4 w-4" />
          Dashboard
        </Button>
      }
    >
      <div className="container py-6 space-y-6">
        <ActionDashboard
          actions={actions}
          onEditAction={handleEditAction}
          isLoading={isLoading}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <EmailIntegrationCard />
        </div>
      </div>
    </AppLayout>
  );
}
