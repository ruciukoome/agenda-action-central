
import { useNavigate } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { useToast } from "@/components/ui/use-toast";
import { createAction } from "@/lib/actions";
import { Header } from "@/components/Header";

export default function AddAction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSave = async (action: ActionItem) => {
    try {
      // Use our createAction function to add the new action to our store
      await createAction(action);
      
      toast({
        title: "Action created",
        description: "Your new action item has been created successfully.",
      });
      
      // Navigate back to the dashboard
      navigate("/");
    } catch (error) {
      console.error("Failed to create action:", error);
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Add New Action Item</h1>
        <ActionForm onSave={handleSave} />
      </div>
    </div>
  );
}
