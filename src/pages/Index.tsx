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
import { PageContainer } from "@/components/layout/primitives";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions } from "@/lib/actions";
import { toast } from "@/lib/toast-wrapper";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { ChartPieIcon, Mail, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
        const data = await fetchActions();
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

  const handleActionUpdated = (updated: ActionItem) => {
    setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  return (
    <AppLayout
      title="Action Items"
      actions={
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email Notifications</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Email Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <EmailIntegrationCard />
              </div>
            </SheetContent>
          </Sheet>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2"
          >
            <ChartPieIcon className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      }
    >
      <PageContainer>
        <ActionDashboard
          actions={actions}
          onEditAction={handleEditAction}
          onActionUpdated={handleActionUpdated}
          isLoading={isLoading}
        />
      </PageContainer>
    </AppLayout>
  );
}
