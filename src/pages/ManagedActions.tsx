
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionItem } from "@/types/action";
import { fetchActions, deleteAction } from "@/lib/actions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/utils/emailUtils";
import { Trash2, FileExport } from "lucide-react";

export default function ManagedActions() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "pending">("all");

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

  const handleSelectAction = (actionId: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredActionIds = getFilteredActions().map(action => action.id);
      setSelectedActions(filteredActionIds);
    } else {
      setSelectedActions([]);
    }
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
      
      setSelectedActions([]);
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

  const getFilteredActions = () => {
    switch (activeTab) {
      case "completed":
        return actions.filter(action => action.completed);
      case "pending":
        return actions.filter(action => !action.completed);
      default:
        return actions;
    }
  };

  const filteredActions = getFilteredActions();
  
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Actions</h1>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value as "all" | "completed" | "pending");
              setSelectedActions([]);
            }} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportSelected()}
                disabled={selectedActions.length === 0}
              >
                <FileExport className="mr-2 h-4 w-4" />
                Export ({selectedActions.length})
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedActions.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedActions.length})
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableCaption>
                {filteredActions.length > 0 
                  ? `Showing ${filteredActions.length} action${filteredActions.length > 1 ? 's' : ''}` 
                  : 'No actions found'}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={
                        filteredActions.length > 0 && 
                        selectedActions.length === filteredActions.length
                      } 
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Meeting Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  renderSkeletons()
                ) : filteredActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No actions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedActions.includes(action.id)} 
                          onCheckedChange={() => handleSelectAction(action.id)}
                          aria-label={`Select ${action.description}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{action.description}</TableCell>
                      <TableCell>{action.department}</TableCell>
                      <TableCell>{formatDate(action.meetingDate)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          action.priority === "high" ? "bg-red-100 text-red-800" :
                          action.priority === "medium" ? "bg-amber-100 text-amber-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {action.priority}
                        </div>
                      </TableCell>
                      <TableCell>{action.ownerEmail}</TableCell>
                      <TableCell>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          action.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {action.completed ? "Completed" : action.progressStatus}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
