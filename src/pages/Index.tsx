
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions, subscribeToActions } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionItem[]>([]);
  
  const { data: initialActions, isLoading } = useQuery({
    queryKey: ['actions'],
    queryFn: fetchActions
  });
  
  useEffect(() => {
    if (initialActions) {
      setActions(initialActions);
    }
  }, [initialActions]);
  
  useEffect(() => {
    const subscription = subscribeToActions((updatedAction) => {
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
      subscription.unsubscribe();
    };
  }, [toast]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
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
