
import { useState } from "react";
import { Priority, ProgressStatus, Department } from "@/types/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { getDepartments, getPriorities, getProgressStatuses } from "@/data/mockActions";

export interface Filters {
  search: string;
  priority: Priority | "all";
  department: Department | "all";
  progress: ProgressStatus | "all";
  completed: "yes" | "no" | "all";
}

interface ActionFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export function ActionFilters({ filters, onFilterChange }: ActionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const resetFilters = () => {
    onFilterChange({
      search: "",
      priority: "all",
      department: "all",
      progress: "all",
      completed: "all"
    });
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Filters</h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {isExpanded ? "Less filters" : "More filters"}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search action items..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={filters.priority}
            onValueChange={(value) => onFilterChange({ ...filters, priority: value as Priority | "all" })}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {getPriorities().map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Select
              value={filters.department}
              onValueChange={(value) => onFilterChange({ ...filters, department: value as Department | "all" })}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="progress">Progress</Label>
            <Select
              value={filters.progress}
              onValueChange={(value) => onFilterChange({ ...filters, progress: value as ProgressStatus | "all" })}
            >
              <SelectTrigger id="progress">
                <SelectValue placeholder="Select progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Progress</SelectItem>
                {getProgressStatuses().map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="completed">Completion</Label>
            <Select
              value={filters.completed}
              onValueChange={(value) => onFilterChange({ ...filters, completed: value as "yes" | "no" | "all" })}
            >
              <SelectTrigger id="completed">
                <SelectValue placeholder="Select completion status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="yes">Completed</SelectItem>
                <SelectItem value="no">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
