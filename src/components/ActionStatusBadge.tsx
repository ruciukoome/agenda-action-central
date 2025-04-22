
import { Badge } from "@/components/ui/badge";
import { Priority, ProgressStatus } from "@/types/action";
import { cn } from "@/lib/utils";

interface ActionStatusBadgeProps {
  type: "priority" | "progress" | "completion";
  value: string;
  className?: string;
}

export function ActionStatusBadge({ type, value, className }: ActionStatusBadgeProps) {
  let variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline" = "default";
  
  let badgeContent = value;
  
  // Handle priority badges
  if (type === "priority") {
    switch (value as Priority) {
      case "high":
        variant = "destructive";
        break;
      case "medium":
        variant = "default";
        badgeContent = "Medium";
        break;
      case "low":
        variant = "secondary";
        badgeContent = "Low";
        break;
    }
  }
  
  // Handle progress badges
  if (type === "progress") {
    switch (value as ProgressStatus) {
      case "Not Started":
        variant = "outline";
        break;
      case "25%":
        variant = "secondary";
        break;
      case "50%":
        variant = "secondary";
        break;
      case "75%":
        variant = "default";
        break;
      case "100%":
        variant = "default";
        break;
    }
  }
  
  // Handle completion badges
  if (type === "completion") {
    if (value === "true") {
      variant = "default";
      badgeContent = "Completed";
    } else {
      variant = "outline";
      badgeContent = "Pending";
    }
  }
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        type === "priority" && value === "high" && "bg-red-500 hover:bg-red-600",
        type === "progress" && value === "100%" && "bg-green-500 hover:bg-green-600",
        type === "completion" && value === "true" && "bg-green-500 hover:bg-green-600",
        className
      )}
    >
      {badgeContent}
    </Badge>
  );
}
