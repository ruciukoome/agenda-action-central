import { useMemo, useState } from "react";
import { Todo, TodoStatus, TODO_STATUS_LABELS } from "@/types/todo";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TodoKanbanCard } from "./TodoKanbanCard";
import { TodoFormDialog } from "./TodoFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, ListTodo, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS: { key: TodoStatus; label: string; headerClass: string; dotClass: string }[] = [
  { key: "todo", label: "To Do", headerClass: "bg-slate-100", dotClass: "bg-slate-400" },
  { key: "in_progress", label: "In Progress", headerClass: "bg-blue-100", dotClass: "bg-blue-500" },
  { key: "done", label: "Done", headerClass: "bg-emerald-100", dotClass: "bg-emerald-500" },
];

export function TodoBoard() {
  const { todos, isLoading, createTodo, updateTodo, moveStatus, deleteTodo } = useTodos();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return todos;
    return todos.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q)
    );
  }, [todos, search]);

  const grouped = useMemo(() => {
    const map: Record<TodoStatus, Todo[]> = { todo: [], in_progress: [], done: [] };
    for (const t of filtered) map[t.status].push(t);
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.status === "done").length;
    const inProgress = todos.filter((t) => t.status === "in_progress").length;
    return { total, done, inProgress };
  }, [todos]);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditing(todo);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <ListTodo className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold leading-tight">My To-Do List</h2>
          <span className="text-xs text-muted-foreground">
            {stats.total} total · {stats.inProgress} in progress · {stats.done} done
          </span>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search to-dos…"
              className="pl-8 w-full lg:w-56"
            />
          </div>
          <Button onClick={handleCreate} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> New To-Do
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 xl:grid-cols-3">
        {COLUMNS.map((col) => (
          <Card key={col.key} className="border-border/60 bg-muted/30 min-w-0">
            <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg", col.headerClass)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  {col.label}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground/60">
                {grouped[col.key].length}
              </span>
            </div>
            <CardContent className="p-2 space-y-2 min-h-[120px]">
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : grouped[col.key].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
                  {col.key === "done" ? (
                    <CheckCircle2 className="h-5 w-5 mb-1 opacity-50" />
                  ) : (
                    <ListTodo className="h-5 w-5 mb-1 opacity-50" />
                  )}
                  <span>No items</span>
                </div>
              ) : (
                grouped[col.key].map((todo) => (
                  <TodoKanbanCard
                    key={todo.id}
                    todo={todo}
                    onEdit={handleEdit}
                    onDelete={(t) => setDeleteTarget(t)}
                    onMove={(t, status) => moveStatus(t.id, status)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <TodoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={async (input) => {
          if (editing) {
            await updateTodo(editing.id, input);
          } else {
            await createTodo(input);
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this to-do?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) await deleteTodo(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
