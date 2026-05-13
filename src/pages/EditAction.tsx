
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { toast } from "@/lib/toast-wrapper";
import { fetchActions, updateAction } from "@/lib/actions";
import { AppLayout } from "@/components/layout/AppLayout";

export default function EditAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAction = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const actions = await fetchActions();
        const foundAction = actions.find(a => a.id === id);

        if (foundAction) {
          setAction(foundAction);
        } else {
          setError("The action you're trying to edit could not be found.");
          toast.error("Action not found", {
            description: "The action you're trying to edit could not be found.",
          });
          setTimeout(() => {
            navigate("/managed-actions");
          }, 3000);
        }
      } catch (error) {
        console.error("Failed to load action:", error);
        setError("Failed to load action details. Please try again.");
        toast.error("Error", {
          description: "Failed to load action details. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadAction();
    }
  }, [id, navigate]);

  const handleSave = async (updatedAction: ActionItem) => {
    try {
      await updateAction(updatedAction);

      toast.success("Action Updated", {
        description: "The action has been updated successfully.",
      });

      const returnTo = localStorage.getItem("EDIT_RETURN_TO") || "/managed-actions";
      localStorage.removeItem("EDIT_RETURN_TO");
      // Reset pointer-events that Radix may leave on body after popover/dialog close
      document.body.style.pointerEvents = "";
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        navigate(returnTo);
      }, 0);
    } catch (error) {
      console.error("Failed to update action:", error);
      toast.error("Error", {
        description: error instanceof Error
          ? `Failed to update action: ${error.message}`
          : "Failed to update action. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="container max-w-3xl py-6" />
      </AppLayout>
    );
  }

  if (error || !action) {
    return (
      <AppLayout title="Action Not Found">
        <div className="container max-w-3xl py-6">
          <p>{error || "The action you're looking for could not be found."}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Action Item">
      <div className="container max-w-3xl py-6">
        <ActionForm actionToEdit={action} onSave={handleSave} />
      </div>
    </AppLayout>
  );
}
