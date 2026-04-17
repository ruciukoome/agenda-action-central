import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionItem, ProgressStatus } from "@/types/action";
import { ActionKanbanCard } from "@/components/ActionKanbanCard";
import { ActionFilters, Filters } from "@/components/ActionFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ListTodo,
  Loader2,
  CheckCircle2,
  AlarmClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";

interface ActionDashboardProps {
  actions: ActionItem[];
  onEditAction: (action: ActionItem) => void;
  isLoading?: boolean;
}

type ColumnKey = "Not Started" | "25%" | "50%" | "75%" | "100%";

const COLUMNS: { key: ColumnKey; label: string; headerClass: string; dotClass: string }[] = [
  {
    key: "Not Started",
    label: "Not Started",
    headerClass: "bg-blue-100/70 text-blue-900 border-blue-200",
    dotClass: "bg-blue-500",
  },
  {
    key: "25%",
    label: "25%",
    headerClass: "bg-indigo-100/70 text-indigo-900 border-indigo-200",
    dotClass: "bg-indigo-500",
  },
  {
    key: "50%",
    label: "50%",
    headerClass: "bg-violet-100/70 text-violet-900 border-violet-200",
    dotClass: "bg-violet-500",
  },
  {
    key: "75%",
    label: "75%",
    headerClass: "bg-teal-100/70 text-teal-900 border-teal-200",
    dotClass: "bg-teal-500",
  },
  {
    key: "100%",
    label: "Complete",
    headerClass: "bg-pink-100/70 text-pink-900 border-pink-200",
    dotClass: "bg-pink-500",
  },
];

export function ActionDashboard({
  actions,
  onEditAction,
  isLoading = false,
}: ActionDashboardProps) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priority: "all",
    department: "all",
    progress: "all",
    completed: "all",
  });

  const filteredActions = useMemo(
    () =>
      actions.filter((action) => {
        if (
          filters.search &&
          !action.description.toLowerCase().includes(filters.search.toLowerCase()) &&
          !action.ownerEmail.toLowerCase().includes(filters.search.toLowerCase()) &&
          !action.department.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }
        if (filters.priority !== "all" && action.priority !== filters.priority) return false;
        if (filters.department !== "all" && action.department !== filters.department) return false;
        if (filters.progress !== "all" && action.progressStatus !== filters.progress) return false;
        if (filters.completed === "yes" && !action.completed) return false;
        if (filters.completed === "no" && action.completed) return false;
        return true;
      }),
    [actions, filters]
  );

  const stats = useMemo(() => {
    const total = actions.length;
    const completed = actions.filter((a) => a.completed || a.progressStatus === "100%").length;
    const inProgress = actions.filter(
      (a) => !a.completed && ["25%", "50%", "75%"].includes(a.progressStatus)
    ).length;
    const today = new Date();
    const dueSoon = actions.filter((a) => {
      if (!a.dueDate || a.completed) return false;
      const d = parseISO(a.dueDate);
      if (!isValid(d)) return false;
      const diff = differenceInCalendarDays(d, today);
      return diff >= 0 && diff <= 7;
    }).length;
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
    return {
      total,
      inProgressPct: pct(inProgress),
      completedPct: pct(completed),
      dueSoon,
    };
  }, [actions]);

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, ActionItem[]> = {
      "Not Started": [],
      "25%": [],
      "50%": [],
      "75%": [],
      "100%": [],
    };
    filteredActions.forEach((a) => {
      const key = (a.progressStatus === "Continuous" ? "Not Started" : a.progressStatus) as ColumnKey;
      if (map[key]) map[key].push(a);
    });
    return map;
  }, [filteredActions]);

  const hasFilters =
    filters.search !== "" ||
    filters.priority !== "all" ||
    filters.department !== "all" ||
    filters.progress !== "all" ||
    filters.completed !== "all";

  const clearFilters = () =>
    setFilters({
      search: "",
      priority: "all",
      department: "all",
      progress: "all",
      completed: "all",
    });

  const statCards = [
    {
      label: "Total Actions",
      value: stats.total,
      icon: ListTodo,
      gradient: "from-primary/15 to-primary/5",
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "In Progress",
      value: `${stats.inProgressPct}%`,
      icon: Loader2,
      gradient: "from-indigo-500/15 to-indigo-500/5",
      iconClass: "bg-indigo-500/15 text-indigo-600",
    },
    {
      label: "Completed",
      value: `${stats.completedPct}%`,
      icon: CheckCircle2,
      gradient: "from-emerald-500/15 to-emerald-500/5",
      iconClass: "bg-emerald-500/15 text-emerald-600",
    },
    {
      label: "Due Soon",
      value: stats.dueSoon,
      icon: AlarmClock,
      gradient: "from-rose-500/15 to-rose-500/5",
      iconClass: "bg-rose-500/15 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top bar: title + search + new */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search actions, owners, departments..."
            className="pl-10 h-11 bg-card/60 backdrop-blur-sm shadow-sm border-border/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            More filters
          </Button>
          <Button onClick={() => navigate("/add")} className="gap-2">
            <Plus className="h-4 w-4" /> New Action
          </Button>
        </div>
      </div>

      {/* Collapsible advanced filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleTrigger className="sr-only">Toggle filters</CollapsibleTrigger>
        <CollapsibleContent>
          <ActionFilters filters={filters} onFilterChange={setFilters} />
        </CollapsibleContent>
      </Collapsible>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className={cn(
                "p-4 border-border/60 bg-gradient-to-br shadow-sm",
                s.gradient
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.iconClass)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map((c) => (
            <div key={c.key} className="space-y-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-xl font-medium mb-2">No action items found</h3>
          <p className="text-muted-foreground mb-4">
            {hasFilters ? "Try adjusting your filters" : "Start by adding a new action item"}
          </p>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => navigate("/add")}>
              <Plus className="mr-1 h-4 w-4" /> Add First Action
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] md:auto-cols-fr md:grid-cols-5 gap-4 min-w-full">
            {COLUMNS.map((col) => {
              const items = grouped[col.key];
              return (
                <div key={col.key} className="flex flex-col min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 mb-3",
                      col.headerClass
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
                      <span className="text-sm font-semibold">{col.label}</span>
                    </div>
                    <span className="text-xs font-medium bg-background/70 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5 min-h-[80px]">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic px-1 py-3 text-center">
                        No items
                      </p>
                    ) : (
                      items.map((action) => (
                        <ActionKanbanCard
                          key={action.id}
                          action={action}
                          onEdit={onEditAction}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
