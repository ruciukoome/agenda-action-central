import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActionDraft, deleteDraft, listDrafts } from "@/lib/drafts";
import { toast } from "@/lib/toast-wrapper";
import { format } from "date-fns";
import {
  FileText,
  Pencil,
  Trash2,
  Plus,
  Clock,
  User,
  Building2,
  LayoutGrid,
  Rows3,
  List as ListIcon,
  Table as TableIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "large" | "medium" | "list" | "details";

const VIEW_STORAGE_KEY = "drafts:view-mode";

const meetingPalette = [
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-red-500",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-green-500",
];
const colorFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return meetingPalette[h % meetingPalette.length];
};

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<ActionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "medium";
    return (localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode) || "medium";
  });

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const load = async () => {
    setLoading(true);
    try {
      setDrafts(await listDrafts());
    } catch (e: any) {
      toast.error("Failed to load drafts", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      toast.success("Draft deleted");
    } catch (e: any) {
      toast.error("Failed to delete draft", { description: e.message });
    }
  };

  const grouped = useMemo(() => {
    return drafts.reduce<Record<string, ActionDraft[]>>((acc, d) => {
      const key = d.meetingTitle?.trim() || "Untitled meeting";
      (acc[key] ||= []).push(d);
      return acc;
    }, {});
  }, [drafts]);

  return (
    <AppLayout
      title="My Drafts"
      actions={
        <Button
          size="sm"
          onClick={() => navigate("/add-action")}
          className="gap-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white border-0 shadow-md"
        >
          <Plus className="h-4 w-4" /> New Action
        </Button>
      }
    >
      <div className="container max-w-6xl py-6 space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative p-6 sm:p-8 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white bg-sky-600">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-pink-400/30 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="rounded-2xl bg-white/20 backdrop-blur p-3 ring-1 ring-white/30 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                    Private workspace
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                  Action item drafts
                </h2>
                <p className="text-sm text-white/85 mt-1 max-w-xl">
                  Pause anything mid-thought. Resume any draft to finish it and submit as an action.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 font-medium">
                    {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 font-medium">
                    {Object.keys(grouped).length} {Object.keys(grouped).length === 1 ? "meeting" : "meetings"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Toolbar */}
        {drafts.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Choose how you'd like your drafts to appear.
            </p>
            <TooltipProvider delayDuration={200}>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as ViewMode)}
                className="border rounded-lg p-1 bg-card shadow-sm"
              >
                {(
                  [
                    { v: "large", icon: LayoutGrid, label: "Large icons" },
                    { v: "medium", icon: Rows3, label: "Medium icons" },
                    { v: "list", icon: ListIcon, label: "List" },
                    { v: "details", icon: TableIcon, label: "Details" },
                  ] as const
                ).map(({ v, icon: Icon, label }) => (
                  <Tooltip key={v}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={v}
                        aria-label={label}
                        className="data-[state=on]:bg-gradient-to-br data-[state=on]:from-fuchsia-500 data-[state=on]:to-indigo-500 data-[state=on]:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
            </TooltipProvider>
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card className="border-dashed border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-indigo-50">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 p-4 mb-4 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg">No drafts yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Pause any in-progress action item with "Save as Draft" and pick it up here later.
              </p>
              <Button
                className="mt-5 gap-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white border-0"
                onClick={() => navigate("/add-action")}
              >
                <Plus className="h-4 w-4" /> Create your first action
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([meeting, items]) => {
              const accent = colorFor(meeting);
              return (
                <section key={meeting} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", accent)} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide">
                      {meeting}
                    </h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">{items.length}</Badge>
                    <Separator className="flex-1" />
                  </div>

                  <DraftsView
                    view={view}
                    items={items}
                    accent={accent}
                    onResume={(id) => navigate(`/add-action?draftId=${id}`)}
                    onDelete={handleDelete}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DraftsView({
  view,
  items,
  accent,
  onResume,
  onDelete,
}: {
  view: ViewMode;
  items: ActionDraft[];
  accent: string;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (view === "details") {
    return (
      <div className="rounded-lg border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Description</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Owner</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Department</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Updated</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 max-w-xs truncate">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-6 w-1 rounded bg-gradient-to-b", accent)} />
                    {d.description?.trim() || (
                      <span className="italic text-muted-foreground">Untitled draft</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{d.ownerEmail || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{d.department || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                  {format(new Date(d.updatedAt), "PP")}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onDelete(d.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onResume(d.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="divide-y rounded-lg border bg-card">
        {items.map((d) => (
          <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
            <div className={cn("h-9 w-9 rounded-md bg-gradient-to-br text-white flex items-center justify-center shrink-0 shadow-sm", accent)}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {d.description?.trim() || <span className="italic text-muted-foreground font-normal">Untitled draft</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {[d.ownerEmail, d.department, `Updated ${format(new Date(d.updatedAt), "PP")}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDelete(d.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => onResume(d.id)} className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white border-0">
              <Pencil className="h-4 w-4 mr-1" /> Resume
            </Button>
          </div>
        ))}
      </div>
    );
  }

  const gridCols =
    view === "large"
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid gap-3", gridCols)}>
      {items.map((d) => (
        <Card
          key={d.id}
          className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/60"
        >
          <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent)} />
          <CardHeader className={cn(view === "large" ? "pb-3" : "pb-2 pt-4")}>
            <div className="flex items-start gap-3">
              <div className={cn("rounded-lg bg-gradient-to-br text-white p-2 shadow-sm shrink-0", accent)}>
                <FileText className={cn(view === "large" ? "h-5 w-5" : "h-4 w-4")} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className={cn("line-clamp-2", view === "large" ? "text-base" : "text-sm")}>
                  {d.description?.trim() || (
                    <span className="italic text-muted-foreground font-normal">Untitled draft</span>
                  )}
                </CardTitle>
                <CardDescription className="space-y-1 pt-1.5 text-xs">
                  {d.ownerEmail && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" /> {d.ownerEmail}
                    </span>
                  )}
                  {d.department && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> {d.department}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {format(new Date(d.updatedAt), "PP p")}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-end gap-2 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(d.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button
              size="sm"
              onClick={() => onResume(d.id)}
              className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white border-0"
            >
              <Pencil className="h-4 w-4 mr-1" /> Resume
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
