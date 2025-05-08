
import { useState, useCallback } from "react";
import { ActionItem } from "@/types/action";
import { deleteAction } from "@/lib/postgres-actions";
import { toast } from "@/components/ui/use-toast";
import { useActionExport } from "@/hooks/useActionExport";

export function useActionOperations(actions: ActionItem[], onActionDeleted: () => void) {
  const { handleExport } = useActionExport();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteSelected = async (selectedActions: string[]) => {
    if (selectedActions.length === 0 || isDeleting) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedActions.length} action${selectedActions.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmed) return;
    
    try {
      setIsDeleting(true);
      let deletedCount = 0;
      
      for (const id of selectedActions) {
        try {
          // Pass a user ID for PostgreSQL - in a real app, get this from auth context
          const userId = localStorage.getItem("USER_ID") || "test-user-id";
          await deleteAction(id, userId);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete action ${id}:`, error);
        }
      }
      
      if (deletedCount > 0) {
        toast({
          title: "Actions deleted",
          description: `Successfully deleted ${deletedCount} action${deletedCount > 1 ? 's' : ''}.`,
        });
        
        // Refresh the actions list after deletion
        onActionDeleted();
      }
      
      if (deletedCount < selectedActions.length) {
        toast({
          title: "Partial success",
          description: `${selectedActions.length - deletedCount} action(s) could not be deleted.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete actions:", error);
      toast({
        title: "Error deleting actions",
        description: "Some actions could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportSelected = (format: "csv" | "excel", selectedActions: string[], allActions: ActionItem[]) => {
    if (selectedActions.length === 0) return;
    
    // Filter the selected actions from the full list
    const actionsToExport = allActions.filter(action => 
      selectedActions.includes(action.id)
    );
    
    handleExport(format, actionsToExport);
  };

  return {
    handleDeleteSelected,
    handleExportSelected,
    isDeleting
  };
}
