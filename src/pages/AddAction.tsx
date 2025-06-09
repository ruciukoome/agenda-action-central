
import { useNavigate } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { toast } from "@/lib/toast-wrapper";
import { createAction } from "@/lib/postgres-actions"; // Changed to use postgres-actions
import { Header } from "@/components/Header";

export default function AddAction() {
  const navigate = useNavigate();
  
  const handleSave = async (action: ActionItem) => {
    try {
      console.log("Saving action with due date:", action.dueDate);
      
      // Get user ID from localStorage - in a real app, get this from auth context
      const userId = localStorage.getItem("USER_ID") || "test-user-id";
      
      // Use our createAction function to add the new action to our store
      await createAction(action, userId);
      
      toast.success("Action created", {
        description: "Your new action item has been created successfully.",
      });
      
      // Navigate back to the dashboard
      navigate("/");
    } catch (error) {
      console.error("Failed to create action:", error);
      toast.error("Error", {
        description: "Failed to create action. Please try again.",
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
