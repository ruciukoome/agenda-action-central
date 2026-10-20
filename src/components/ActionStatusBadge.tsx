
import { Badge } from "@/components/ui/badge";
import { Priority, ProgressStatus } from "@/types/action";
import { cn } from "@/lib/utils";

interface ActionStatusBadgeProps {
  type: "priority" | "progress" | "completion";
  value: string;
  className?: string;
}

type Variant = "default" | "destructive" | "outline" | "success" | "warning" | "info" | "muted";

export function ActionStatusBadge({ type, value, className }: ActionStatusBadgeProps) {
  let variant: Variant = "default";
  let badgeContent = value;

  if (type === "priority") {
    switch (value as Priority) {
      case "high": variant = "destructive"; break;
      case "medium": variant = "warning"; badgeContent = "Medium"; break;
      case "low": variant = "muted"; badgeContent = "Low"; break;
    }
  }

  if (type === "progress") {
    switch (value as ProgressStatus) {
      case "Not Started": variant = "muted"; break;
      case "25%":
      case "50%":
      case "75%": variant = "warning"; break;
      case "100%": variant = "success"; break;
      case "Continuous": variant = "info"; break;
    }
  }

  if (type === "completion") {
    if (value === "true") { variant = "success"; badgeContent = "Completed"; }
    else { variant = "muted"; badgeContent = "Pending"; }
  }

  return (
    <Badge variant={variant} className={cn(className)}>
      {badgeContent}
    </Badge>
  );
}
