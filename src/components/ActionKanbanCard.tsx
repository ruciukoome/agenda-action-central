import { ActionItem } from "@/types/action";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, CheckCircle2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { QuickStatusUpdate } from "@/components/QuickStatusUpdate";

interface ActionKanbanCardProps {
  action: ActionItem;
  onEdit: (action: ActionItem) => void;
  onUpdated?: (updated: ActionItem) => void;
}

const priorityStyles: Record<string, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function getInitial(email: string) {
  return email?.trim()?.[0]?.toUpperCase() ?? "?";
}

function formatDueDate(d?: string) {
  if (!d) return null;
  const parsed = parseISO(d);
  if (!isValid(parsed)) return null;
  return format(parsed, "MMM d, yyyy");
}

export function ActionKanbanCard({ action, onEdit, onUpdated }: ActionKanbanCardProps) {
  const due = formatDueDate(action.dueDate);

  return (
    <Card
      onClick={() => onEdit(action)}
      className="group cursor-pointer p-3 bg-card hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 border border-border/60"
    >
      <div className="space-y-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
              {getInitial(action.ownerEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {action.department}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {action.ownerEmail}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize",
              priorityStyles[action.priority] ?? priorityStyles.low
            )}
          >
            {action.priority}
          </span>
          <QuickStatusUpdate action={action} onUpdated={onUpdated} />
        </div>
      </div>

      <p className="text-xs text-foreground/80 line-clamp-2 mb-2">
        {action.description}
      </p>

      <div className="flex items-center justify-between gap-2">
        {due ? (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due {due}</span>
          </div>
        ) : (
          <span />
        )}
        {action.completed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>
    </Card>
  );
}
