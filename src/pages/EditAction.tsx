
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { useToast } from "@/components/ui/use-toast";
import { fetchActions, updateAction } from "@/lib/actions";
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
        const actions = await fetchActions();
        const foundAction = actions.find(a => a.id === id);
        
        if (foundAction) {
          setAction(foundAction);
        } else {
          toast({
            title: "Action not found",
            description: "The action you're trying to edit could not be found.",
            variant: "destructive",
          });
          navigate("/");
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
      await updateAction(updatedAction);
      toast({
        title: "Action updated",
        description: "Your action item has been updated successfully.",
      });
      navigate("/");
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
