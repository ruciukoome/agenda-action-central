import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionItem } from '@/types/action';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActionKanbanCard } from '@/components/ActionKanbanCard';
import { TodoBoard } from '@/components/todos/TodoBoard';
import { ClipboardList, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ProgressStatus } from '@/types/action';

const ACTION_COLUMNS: { key: ProgressStatus | "Not Started"; label: string; headerClass: string; dotClass: string }[] = [
  { key: "Not Started", label: "Not Started", headerClass: "bg-muted", dotClass: "bg-muted-foreground" },
  { key: "25%", label: "25%", headerClass: "bg-warning-soft", dotClass: "bg-warning" },
  { key: "50%", label: "50%", headerClass: "bg-warning-soft", dotClass: "bg-warning" },
  { key: "75%", label: "75%", headerClass: "bg-info-soft", dotClass: "bg-info" },
  { key: "100%", label: "Complete", headerClass: "bg-success-soft", dotClass: "bg-success" },
];

export default function MyActions() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyActions = async () => {
      if (!user?.email) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('actions')
          .select('*')
          .eq('owner_email', user.email);

        if (error) {
          console.error('Error fetching actions:', error);
          setIsLoading(false);
          return;
        }

        const mappedActions: ActionItem[] = data.map((action: any) => ({
          id: action.id,
          description: action.description,
          department: action.department,
          meetingDate: action.meeting_date,
          priority: action.priority,
          ownerEmail: action.owner_email,
          completed: action.completed,
          progressStatus: action.progress_status,
          notes: action.notes || '',
          createdAt: action.created_at,
          updatedAt: action.updated_at,
          dueDate: action.due_date,
        }));

        setActions(mappedActions);
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchMyActions();
  }, [user]);

  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit-action/${action.id}`);
  };

  const handleActionUpdated = (updated: ActionItem) => {
    setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const filteredActions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.description.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        (a.notes ?? "").toLowerCase().includes(q)
    );
  }, [actions, search]);

  const groupedActions = useMemo(() => {
    const map: Record<string, ActionItem[]> = {
      "Not Started": [], "25%": [], "50%": [], "75%": [], "100%": [],
    };
    for (const a of filteredActions) {
      const key = (a.progressStatus as string) === "Continuous" ? "Not Started" : (a.progressStatus as string);
      if (map[key]) map[key].push(a);
      else map["Not Started"].push(a);
    }
    return map;
  }, [filteredActions]);

  return (
    <AppLayout title="My Actions">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Assigned Actions Kanban */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold leading-tight">Assigned Action Items</h2>
              <span className="text-xs text-muted-foreground">
                {actions.length} total
              </span>
            </div>
            <div className="relative w-full lg:w-auto">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions…"
                className="pl-8 w-full lg:w-56"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 xl:grid-cols-3 2xl:grid-cols-5">
            {ACTION_COLUMNS.map((col) => (
              <Card key={col.key} className="border-border/60 bg-muted/30 min-w-0">
                <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg", col.headerClass)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground/60">
                    {groupedActions[col.key]?.length ?? 0}
                  </span>
                </div>
                <CardContent className="p-2 space-y-2 min-h-[120px]">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </>
                  ) : (groupedActions[col.key]?.length ?? 0) === 0 ? (
                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                      No items
                    </div>
                  ) : (
                    groupedActions[col.key].map((action) => (
                      <ActionKanbanCard
                        key={action.id}
                        action={action}
                        onEdit={handleEditAction}
                        onUpdated={handleActionUpdated}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!isLoading && actions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No actions assigned to you yet.
            </div>
          )}
        </section>

        <Separator />

        {/* Personal To-Do List */}
        <section>
          <TodoBoard />
        </section>
      </div>
    </AppLayout>
  );
}
