
import { useState, useMemo } from "react";
import { ActionItem } from "@/types/action";

export type ActionFilterTab = "all" | "completed" | "pending";

export function useActionFiltering(actions: ActionItem[]) {
  const [activeTab, setActiveTab] = useState<ActionFilterTab>("all");

  const filteredActions = useMemo(() => {
    switch (activeTab) {
      case "completed":
        return actions.filter(action => action.completed);
      case "pending":
        return actions.filter(action => !action.completed);
      default:
        return actions;
    }
  }, [actions, activeTab]);

  return {
    activeTab,
    setActiveTab,
    filteredActions,
  };
}
