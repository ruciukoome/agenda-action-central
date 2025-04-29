
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, FileText } from "lucide-react";

interface ActionsToolbarProps {
  activeTab: "all" | "completed" | "pending";
  onTabChange: (value: "all" | "completed" | "pending") => void;
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
}

export function ActionsToolbar({
  activeTab,
  onTabChange,
  selectedCount,
  onExport,
  onDelete,
}: ActionsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <Tabs value={activeTab} onValueChange={(value) => {
        onTabChange(value as "all" | "completed" | "pending");
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
          onClick={onExport}
          disabled={selectedCount === 0}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export ({selectedCount})
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete ({selectedCount})
        </Button>
      </div>
    </div>
  );
}
