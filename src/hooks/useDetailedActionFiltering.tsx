
import { useMemo } from "react";
import { ActionItem } from "@/types/action";
import { Filters } from "@/components/ActionFilters";

export function useDetailedActionFiltering(actions: ActionItem[], filters: Filters) {
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      // Search filter
      if (filters.search && !action.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Priority filter
      if (filters.priority !== "all" && action.priority !== filters.priority) {
        return false;
      }
      
      // Department filter
      if (filters.department !== "all" && action.department !== filters.department) {
        return false;
      }
      
      // Progress filter
      if (filters.progress !== "all" && action.progressStatus !== filters.progress) {
        return false;
      }
      
      // Completion filter
      if (filters.completed !== "all") {
        if (filters.completed === "yes" && !action.completed) {
          return false;
        }
        if (filters.completed === "no" && action.completed) {
          return false;
        }
      }
      
      return true;
    });
  }, [actions, filters]);

  return filteredActions;
}
