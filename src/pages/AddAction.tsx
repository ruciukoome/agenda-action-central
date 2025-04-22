
import { useNavigate } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { useToast } from "@/components/ui/use-toast";

interface AddActionProps {
  onAddAction: (action: ActionItem) => void;
}

export default function AddAction({ onAddAction }: AddActionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSave = (action: ActionItem) => {
    onAddAction(action);
    toast({
      title: "Action created",
      description: "Your new action item has been created successfully.",
    });
    navigate("/");
  };
  
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Add New Action Item</h1>
      <ActionForm onSave={handleSave} />
    </div>
  );
}
