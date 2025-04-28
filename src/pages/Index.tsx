
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDashboard } from "@/components/ActionDashboard";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { EmailIntegrationCard } from "@/components/EmailIntegrationCard";
import { fetchActions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  
  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const loadActions = async () => {
      const data = await fetchActions();
      setActions(data);
    };

    loadActions();
  }, [session, navigate]);
  
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit/${action.id}`);
  };
  
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
