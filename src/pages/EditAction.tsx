
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { useToast } from "@/components/ui/use-toast";
import { fetchActions } from "@/lib/postgres-actions";
import { updateAction } from "@/lib/postgres-actions";
import { Header } from "@/components/Header";

export default function EditAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [action, setAction] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadAction = async () => {
      try {
        setIsLoading(true);
        // Get a user ID for PostgreSQL - in a real app, get this from auth context
        const userId = localStorage.getItem("USER_ID") || "test-user-id";
        
        const actions = await fetchActions(userId);
        const foundAction = actions.find(a => a.id === id);
        
        if (foundAction) {
          setAction(foundAction);
        } else {
          toast({
            title: "Action not found",
            description: "The action you're trying to edit could not be found.",
            variant: "destructive",
          });
          navigate("/managed-actions");
        }
      } catch (error) {
        console.error("Failed to load action:", error);
        toast({
          title: "Error",
          description: "Failed to load action details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadAction();
    }
  }, [id, navigate, toast]);
  
  const handleSave = async (updatedAction: ActionItem) => {
    try {
      console.log("Saving updated action:", updatedAction);
      // Get a user ID for PostgreSQL - in a real app, get this from auth context
      const userId = localStorage.getItem("USER_ID") || "test-user-id";
      
      await updateAction(updatedAction.id, updatedAction, userId);
      console.log("Action updated successfully, navigating to managed actions page");
      
      // Navigate to the managed actions page after successful update
      navigate("/managed-actions");
    } catch (error) {
      console.error("Failed to update action:", error);
      toast({
        title: "Error",
        description: "Failed to update action. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Loading...</h1>
        </div>
      </div>
    );
  }
  
  if (!action) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Action Not Found</h1>
          <p>The action you're looking for could not be found.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Action Item</h1>
        <ActionForm actionToEdit={action} onSave={handleSave} />
      </div>
    </div>
  );
}
