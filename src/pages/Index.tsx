
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
import { TestEmailNotification } from "@/components/TestEmailNotification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const { user, session, isLoading: authLoading } = useAuth();
  
  const { data: initialActions, isLoading, error } = useQuery({
    queryKey: ['actions'],
    queryFn: fetchActions,
    enabled: !!session // Only fetch when authenticated
  });
  
  useEffect(() => {
    if (initialActions) {
      setActions(initialActions);
      console.log("Initial actions loaded:", initialActions.length);
    }
  }, [initialActions]);
  
  useEffect(() => {
    if (!session) return;
    
    console.log("Setting up realtime subscription for actions");
    const subscription = subscribeToActions((updatedAction) => {
      console.log("Received realtime action update:", updatedAction);
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
    });
    
    return () => {
      console.log("Cleaning up realtime subscription");
      subscription.unsubscribe();
    };
  }, [session, toast]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }
  
  if (!user && !authLoading) {
    // Redirect to auth page if not authenticated
    navigate('/auth');
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading actions...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container py-10">
          <Alert variant="destructive">
            <AlertTitle>Error loading actions</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </AlertDescription>
          </Alert>
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
            <TestEmailNotification />
          </div>
        </div>
      </main>
    </div>
  );
}
