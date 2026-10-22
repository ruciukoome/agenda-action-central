
import { useState } from "react";
import { ActionItem } from "@/types/action";
import { ActionsTable } from "@/components/actions/ActionsTable";
import { ActionsToolbar } from "@/components/actions/ActionsToolbar";
import { ActionFilters, Filters } from "@/components/ActionFilters";
import { useActionFiltering, ActionFilterTab } from "@/hooks/useActionFiltering";
import { useActionSelection } from "@/hooks/useActionSelection";
import { useDetailedActionFiltering } from "@/hooks/useDetailedActionFiltering";
import { useActionOperations } from "@/hooks/useActionOperations";

interface ManagedActionsContentProps {
  actions: ActionItem[];
  isLoading: boolean;
  onActionUpdated: () => void;
}

export function ManagedActionsContent({ actions, isLoading, onActionUpdated }: ManagedActionsContentProps) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priority: "all",
    department: "all",
    progress: "all",
    completed: "all",
  });
  
  const { activeTab, setActiveTab, filteredActions: tabFilteredActions } = useActionFiltering(actions);
  const detailedFilteredActions = useDetailedActionFiltering(tabFilteredActions, filters);
  const { handleDeleteSelected, handleExportSelected } = useActionOperations(
    actions, 
    onActionUpdated // Pass the refresh function to reload actions after delete
  );
  
  const { 
    selectedActions, 
    handleSelectAction, 
    handleSelectAll, 
    clearSelection 
  } = useActionSelection(detailedFilteredActions);

  const handleTabChange = (tab: ActionFilterTab) => {
    setActiveTab(tab);
    clearSelection();
  };

  const handleExport = (format: "csv" | "excel") => {
    handleExportSelected(format, selectedActions, actions);
  };

  return (
    <div className="space-y-6">
      <ActionsToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedCount={selectedActions.length}
        onExport={handleExport}
        onDelete={() => handleDeleteSelected(selectedActions)}
        onImported={onActionUpdated}
      />
      
      <ActionFilters filters={filters} onFilterChange={setFilters} />
      
      <ActionsTable
        actions={detailedFilteredActions}
        isLoading={isLoading}
        selectedActions={selectedActions}
        onSelectAction={handleSelectAction}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
