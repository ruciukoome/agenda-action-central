
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions, subscribeToActions } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  
  // Configure the query with refetch options
  const { data: initialActions, isLoading, refetch } = useQuery({
    queryKey: ['actions'],
    queryFn: fetchActions,
    enabled: !!session, // Only fetch when user is authenticated
    refetchOnWindowFocus: true,
    retry: 3,
  });
  
  useEffect(() => {
    if (initialActions) {
      console.log("Initial actions loaded:", initialActions.length);
      setActions(initialActions);
    }
  }, [initialActions]);
  
  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    console.log("Setting up realtime subscription for actions");
    const subscription = subscribeToActions((updatedAction) => {
      console.log("Received realtime action update:", updatedAction.id);
      setActions(currentActions => {
        const exists = currentActions.some(action => action.id === updatedAction.id);
        if (exists) {
          return currentActions.map(action => 
            action.id === updatedAction.id ? updatedAction : action
          );
        }
        return [updatedAction, ...currentActions];
      });
      
      toast({
        title: "Action Updated",
        description: "An action item has been updated."
      });

      // Force a refetch to ensure consistency with the backend
      refetch();
    });
    
    return () => {
      console.log("Unsubscribing from actions channel");
      subscription.unsubscribe();
    };
  }, [toast, session, navigate, refetch]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading action items...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <ActionDashboard 
              actions={actions} 
              onEditAction={handleEditAction} 
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
