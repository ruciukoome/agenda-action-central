
import { useState, useCallback } from "react";
import { ActionItem } from "@/types/action";
import { deleteAction } from "@/lib/actions";
import { toast } from "@/components/ui/use-toast";
import { useActionExport } from "@/hooks/useActionExport";

export function useActionOperations(actions: ActionItem[], onActionDeleted: () => void) {
  const { handleExport } = useActionExport();
  
  const handleDeleteSelected = async (selectedActions: string[]) => {
    if (selectedActions.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedActions.length} action${selectedActions.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmed) return;
    
    try {
      let deletedCount = 0;
      
      for (const id of selectedActions) {
        await deleteAction(id);
        deletedCount++;
      }
      
      toast({
        title: "Actions deleted",
        description: `Successfully deleted ${deletedCount} action${deletedCount > 1 ? 's' : ''}.`,
      });
      
      onActionDeleted();
    } catch (error) {
      console.error("Failed to delete actions:", error);
      toast({
        title: "Error deleting actions",
        description: "Some actions could not be deleted. Please try again.",
        variant: "destructive",
      });
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
    handleExportSelected
  };
}
