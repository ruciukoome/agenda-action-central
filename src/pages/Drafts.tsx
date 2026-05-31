import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActionDraft, deleteDraft, listDrafts } from "@/lib/drafts";
import { toast } from "@/lib/toast-wrapper";
import { format } from "date-fns";
import { FileText, Pencil, Trash2, Plus, Clock, User, Building2 } from "lucide-react";

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<ActionDraft[]>([]);
  const [loading, setLoading] = useState(true);

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

  const grouped = drafts.reduce<Record<string, ActionDraft[]>>((acc, d) => {
    const key = d.meetingTitle?.trim() || "Untitled meeting";
    (acc[key] ||= []).push(d);
    return acc;
  }, {});

  return (
    <AppLayout
      title="My Drafts"
      actions={
        <Button size="sm" onClick={() => navigate("/add-action")} className="gap-2">
          <Plus className="h-4 w-4" /> New Action
        </Button>
      }
    >
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Hero header */}
        <Card className="overflow-hidden border-border/60">
          <div className="relative p-6 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold tracking-tight">Action item drafts</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Private to you. Resume any draft to finish it and submit as an action.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {Object.keys(grouped).length} {Object.keys(grouped).length === 1 ? "meeting" : "meetings"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid gap-3">
            {[0, 1].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No drafts yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Pause any in-progress action item with "Save as Draft" and pick it up here later.
              </p>
              <Button className="mt-5 gap-2" onClick={() => navigate("/add-action")}>
                <Plus className="h-4 w-4" /> Create your first action
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([meeting, items]) => (
              <section key={meeting} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {meeting}
                  </h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">{items.length}</Badge>
                  <Separator className="flex-1" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((d) => (
                    <Card
                      key={d.id}
                      className="group transition-all hover:shadow-md hover:border-primary/40"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base line-clamp-2">
                          {d.description?.trim() || (
                            <span className="italic text-muted-foreground font-normal">
                              Untitled draft
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="space-y-1 pt-1">
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
                            <Clock className="h-3 w-3" /> Updated {format(new Date(d.updatedAt), "PP p")}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-end gap-2 pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/add-action?draftId=${d.id}`)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Resume
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
