
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { ActionItem } from "@/types/action";
import { fetchActions, deleteAction } from "@/lib/actions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ActionsTable } from "@/components/actions/ActionsTable";
import { ActionsToolbar } from "@/components/actions/ActionsToolbar";
import { useActionSelection } from "@/hooks/useActionSelection";
import { useActionFiltering, ActionFilterTab } from "@/hooks/useActionFiltering";

export default function ManagedActions() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { activeTab, setActiveTab, filteredActions } = useActionFiltering(actions);
  const { selectedActions, handleSelectAction, handleSelectAll, clearSelection } = useActionSelection(filteredActions);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchActions();
      setActions(data);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
      toast({
        title: "Error fetching actions",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActions();

    // Set up realtime subscription
    const channel = supabase
      .channel('actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions'
        },
        () => {
          loadActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadActions]);

  const handleTabChange = (tab: ActionFilterTab) => {
    setActiveTab(tab);
    clearSelection();
  };

  const handleDeleteSelected = async () => {
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
      
      clearSelection();
    } catch (error) {
      console.error("Failed to delete actions:", error);
      toast({
        title: "Error deleting actions",
        description: "Some actions could not be deleted. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportSelected = () => {
    if (selectedActions.length === 0) return;
    
    // Filter the selected actions from the full list
    const actionsToExport = actions.filter(action => 
      selectedActions.includes(action.id)
    );
    
    // Convert actions to CSV format
    const headers = "ID,Description,Department,Meeting Date,Priority,Owner Email,Completed,Progress Status,Notes,Created At,Due Date\n";
    const csvContent = actionsToExport.reduce((csv, action) => {
      return csv + `"${action.id}","${action.description.replace(/"/g, '""')}","${action.department}","${action.meetingDate}","${action.priority}","${action.ownerEmail}","${action.completed}","${action.progressStatus}","${action.notes?.replace(/"/g, '""') || ''}","${action.createdAt}","${action.dueDate || ''}"\n`;
    }, headers);
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `actions_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Actions exported",
      description: `Successfully exported ${actionsToExport.length} action${actionsToExport.length > 1 ? 's' : ''}.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Actions</h1>
        
        <div className="space-y-6">
          <ActionsToolbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            selectedCount={selectedActions.length}
            onExport={handleExportSelected}
            onDelete={handleDeleteSelected}
          />
          
          <ActionsTable
            actions={filteredActions}
            isLoading={isLoading}
            selectedActions={selectedActions}
            onSelectAction={handleSelectAction}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>
    </div>
  );
}
