
import { useNavigate, useParams } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { useToast } from "@/components/ui/use-toast";

interface EditActionProps {
  actions: ActionItem[];
  onUpdateAction: (action: ActionItem) => void;
}

export default function EditAction({ actions, onUpdateAction }: EditActionProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const actionToEdit = actions.find(action => action.id === id);
  
  if (!actionToEdit) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Action Not Found</h1>
        <p>The action item you're trying to edit doesn't exist.</p>
        <button 
          onClick={() => navigate("/")}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const handleSave = (action: ActionItem) => {
    onUpdateAction(action);
    toast({
      title: "Action updated",
      description: "The action item has been updated successfully.",
    });
    navigate("/");
  };
  
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Action Item</h1>
      <ActionForm actionToEdit={actionToEdit} onSave={handleSave} />
    </div>
  );
}
