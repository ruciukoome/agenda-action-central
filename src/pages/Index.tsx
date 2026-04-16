
/**
 * MAIN APPLICATION PAGE
 * -------------------
 * Displays the action dashboard and handles data loading
 * Scoped to the user's organization
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Action Items</h2>
            {organization && (
              <p className="text-muted-foreground text-sm mt-1">{organization.name}</p>
            )}
          </div>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ChartPieIcon className="h-4 w-4" />
            View Dashboard
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <ActionDashboard 
              actions={actions} 
              onEditAction={handleEditAction}
              isLoading={isLoading}
            />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <EmailIntegrationCard />
          </div>
        </div>
      </main>
    </div>
  );
}
