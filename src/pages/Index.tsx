
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions, subscribeToActions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    data: initialActions, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['actions'],
    queryFn: fetchActions,
    retry: 2,
    enabled: !!user, // Only run query when user is authenticated
    meta: {
      onError: (err) => {
        console.error("Error fetching actions:", err);
      }
    }
  });
  
  useEffect(() => {
    if (initialActions) {
      console.log("Setting initial actions:", initialActions.length);
      setActions(initialActions);
    }
  }, [initialActions]);
  
  useEffect(() => {
    if (!user) return; // Don't set up subscription if not authenticated
    
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
  }, [toast, user]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to view and manage actions.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/auth")} className="mt-4">
          Sign In
        </Button>
      </div>
    );
  }
  
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
        <Header />
        <Alert variant="destructive" className="my-6">
          <AlertTitle>Error loading actions</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An unknown error occurred while loading actions."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Retry Loading Actions
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        {realtimeError && (
          <Alert variant="default" className="mb-6">
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
