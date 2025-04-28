
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionItem } from "@/types/action";
import { ActionCard } from "@/components/ActionCard";
import { ActionFilters, Filters } from "@/components/ActionFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActionDashboardProps {
  actions: ActionItem[];
  onEditAction: (action: ActionItem) => void;
  isLoading?: boolean;
}

export function ActionDashboard({ actions, onEditAction, isLoading = false }: ActionDashboardProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priority: "all",
    department: "all",
    progress: "all",
    completed: "all",
  });
  
  const filteredActions = actions.filter((action) => {
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
  
  const handleAddAction = () => {
    console.log("Navigating to add action page");
    navigate("/add");
  };
  
  const handleClearFilters = () => {
    console.log("Clearing filters");
    setFilters({
      search: "",
      priority: "all",
      department: "all",
      progress: "all",
      completed: "all",
    });
  };

  // Render skeleton loaders during loading state
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Action Items</h2>
        <Button onClick={handleAddAction} className="flex items-center">
          <Plus className="mr-1 h-4 w-4" /> New Action
        </Button>
      </div>
      
      <ActionFilters filters={filters} onFilterChange={setFilters} />
      
      {isLoading ? (
        renderSkeletons()
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No action items found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.priority !== "all" || filters.department !== "all" || 
             filters.progress !== "all" || filters.completed !== "all"
              ? "Try adjusting your filters"
              : "Start by adding a new action item"}
          </p>
          {filters.search || filters.priority !== "all" || filters.department !== "all" || 
           filters.progress !== "all" || filters.completed !== "all" ? (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={handleAddAction}>
              <Plus className="mr-1 h-4 w-4" /> Add First Action
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => (
            <ActionCard 
              key={action.id} 
              action={action} 
              onEdit={onEditAction} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
