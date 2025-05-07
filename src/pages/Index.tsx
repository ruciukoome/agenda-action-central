
/**
 * MAIN APPLICATION PAGE
 * -------------------
 * Displays the action dashboard and handles data loading
 * 
 * Backend connections:
 * - Fetches actions from the PostgreSQL database via fetchActions()
 * - Uses polling for data refresh instead of Supabase's realtime
 * - Redirects to auth page if user is not authenticated
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions } from "@/lib/postgres-actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChartPieIcon } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
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
        // Pass a user ID for PostgreSQL - in a real app, get this from auth context
        const userId = localStorage.getItem("USER_ID") || "test-user-id";
        const data = await fetchActions(userId);
        setActions(data);
      } catch (error) {
        console.error("Failed to fetch actions:", error);
        toast({
          title: "Error fetching actions",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadActions();
    
    // Set up polling for data refresh every 30 seconds
    // This replaces Supabase's realtime functionality
    const intervalId = setInterval(() => {
      loadActions();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [session, navigate, toast]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Action Items</h2>
          <Button 
            onClick={navigateToDashboard} 
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
