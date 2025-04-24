
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions, subscribeToActions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  
  const { data: initialActions, isLoading, error } = useQuery({
    queryKey: ['actions'],
    queryFn: fetchActions,
    retry: 2,
    onError: (err) => {
      console.error("Error fetching actions:", err);
    }
  });
  
  useEffect(() => {
    if (initialActions) {
      console.log("Setting initial actions:", initialActions.length);
      setActions(initialActions);
    }
  }, [initialActions]);
  
  useEffect(() => {
    console.log("Setting up real-time subscription...");
    try {
      const subscription = subscribeToActions((updatedAction) => {
        console.log("Real-time action update received:", updatedAction);
        setActions(currentActions => {
          const exists = currentActions.some(action => action.id === updatedAction.id);
          if (exists) {
            console.log("Updating existing action:", updatedAction.id);
            return currentActions.map(action => 
              action.id === updatedAction.id ? updatedAction : action
            );
          }
          console.log("Adding new action:", updatedAction.id);
          return [updatedAction, ...currentActions];
        });
        
        toast({
          title: "Action Updated",
          description: "An action item has been updated."
        });
      });
      
      return () => {
        console.log("Cleaning up real-time subscription");
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      setRealtimeError(error instanceof Error ? error.message : "Unknown error with real-time updates");
      return () => {}; // Empty cleanup function if setup failed
    }
  }, [toast]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Loading actions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTitle>Error loading actions</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An unknown error occurred while loading actions."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        {realtimeError && (
          <Alert variant="warning" className="mb-6">
            <AlertTitle>Real-time Updates Issue</AlertTitle>
            <AlertDescription>
              {realtimeError}. You may need to refresh to see the latest actions.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <ActionDashboard 
              actions={actions} 
              onEditAction={handleEditAction} 
            />
            {actions.length === 0 && !isLoading && (
              <div className="text-center py-8 mt-4 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No actions found. Create your first action by clicking "New Action".</p>
              </div>
            )}
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <EmailIntegrationCard />
          </div>
        </div>
      </main>
    </div>
  );
}
