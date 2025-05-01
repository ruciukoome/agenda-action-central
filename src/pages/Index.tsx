
/**
 * MAIN APPLICATION PAGE
 * -------------------
 * Displays the action dashboard and handles data loading
 * 
 * Backend connections:
 * - Fetches actions from the database via fetchActions()
 * - Sets up real-time subscription to action updates
 * - Redirects to auth page if user is not authenticated
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
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
        const data = await fetchActions();
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

    // Subscribe to realtime updates for the actions table
    const channel = supabase
      .channel('actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          loadActions(); // Reload all actions when any change occurs
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
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
