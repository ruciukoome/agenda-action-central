
import { useState } from "react";
import { ActionItem } from "@/types/action";

export function useActionSelection(actions: ActionItem[]) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  
  const handleSelectAction = (actionId: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const actionIds = actions.map(action => action.id);
      setSelectedActions(actionIds);
    } else {
      setSelectedActions([]);
    }
  };
  
  const clearSelection = () => {
    setSelectedActions([]);
  };

  return {
    selectedActions,
    handleSelectAction,
    handleSelectAll,
    clearSelection
  };
}
