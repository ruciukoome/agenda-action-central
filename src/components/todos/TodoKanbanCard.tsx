import { Todo, TodoStatus } from "@/types/todo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, Pencil, Trash2, ArrowRight, ArrowLeft, CheckCircle2, Tag } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TodoKanbanCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMove: (todo: Todo, status: TodoStatus) => void;
}

const priorityStyles: Record<string, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function formatDate(d?: string | null) {
  if (!d) return null;
  const parsed = parseISO(d);
  if (!isValid(parsed)) return null;
  return format(parsed, "MMM d, yyyy");
}

const STATUS_FLOW: TodoStatus[] = ["todo", "in_progress", "done"];

export function TodoKanbanCard({ todo, onEdit, onDelete, onMove }: TodoKanbanCardProps) {
  const due = formatDate(todo.dueDate);
  const idx = STATUS_FLOW.indexOf(todo.status);
  const prev = idx > 0 ? STATUS_FLOW[idx - 1] : null;
  const next = idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

  return (
    <Card className="group p-3 bg-card hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 border border-border/60 overflow-hidden">
      <div className="space-y-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight break-words">{todo.title}</p>
          {todo.category && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Tag className="h-2.5 w-2.5" />
              {todo.category}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize",
              priorityStyles[todo.priority] ?? priorityStyles.low
            )}
          >
            {todo.priority}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              {prev && (
                <DropdownMenuItem onClick={() => onMove(todo, prev)}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Move to {prev === "in_progress" ? "In Progress" : "To Do"}
                </DropdownMenuItem>
              )}
              {next && (
                <DropdownMenuItem onClick={() => onMove(todo, next)}>
                  <ArrowRight className="h-3.5 w-3.5 mr-2" /> Move to {next === "in_progress" ? "In Progress" : "Done"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(todo)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {todo.description && (
        <p className="text-xs text-foreground/80 line-clamp-2 mb-2">{todo.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {due ? (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due {due}</span>
          </div>
        ) : (
          <span />
        )}
        {todo.status === "done" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>
    </Card>
  );
}
