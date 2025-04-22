
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { mockActions } from "@/data/mockActions";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";

export default function Index() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<ActionItem[]>(mockActions);
  const [currentUserEmail] = useState<string>("james.wilson@example.com");
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
  const handleAddAction = (action: ActionItem) => {
    setActions([action, ...actions]);
  };
  
  const handleUpdateAction = (updatedAction: ActionItem) => {
    setActions(actions.map(action => 
      action.id === updatedAction.id ? updatedAction : action
    ));
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header userEmail={currentUserEmail} />
      
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
