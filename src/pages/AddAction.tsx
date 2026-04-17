
import { useNavigate } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { toast } from "@/lib/toast-wrapper";
import { createAction } from "@/lib/actions";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AddAction() {
  const navigate = useNavigate();

  const handleSave = async (action: ActionItem) => {
    try {
      await createAction(action);
      toast.success("Action created", {
        description: "Your new action item has been created successfully.",
      });
      navigate("/app");
    } catch (error) {
      console.error("Failed to create action:", error);
      toast.error("Error", {
        description: "Failed to create action. Please try again.",
      });
    }
  };

  return (
    <AppLayout title="Add New Action Item">
      <div className="container max-w-3xl py-6">
        <ActionForm onSave={handleSave} />
      </div>
    </AppLayout>
  );
}
