import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionDraft, deleteDraft, listDrafts } from "@/lib/drafts";
import { toast } from "@/lib/toast-wrapper";
import { format } from "date-fns";
import { FileText, Pencil, Trash2 } from "lucide-react";

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

  // Group by meeting title
  const grouped = drafts.reduce<Record<string, ActionDraft[]>>((acc, d) => {
    const key = d.meetingTitle?.trim() || "Untitled meeting";
    (acc[key] ||= []).push(d);
    return acc;
  }, {});

  return (
    <AppLayout title="My Drafts">
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Action item drafts</h2>
            <p className="text-sm text-muted-foreground">
              Private to you. Resume any draft to finish and submit it as an action.
            </p>
          </div>
          <Button onClick={() => navigate("/add-action")}>New Action</Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
              No drafts yet. Use "Save as Draft" on the Add Action page to pause an item.
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([meeting, items]) => (
            <div key={meeting} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{meeting}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="grid gap-3">
                {items.map((d) => (
                  <Card key={d.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {d.description?.trim() || <span className="italic text-muted-foreground">Untitled draft</span>}
                      </CardTitle>
                      <CardDescription>
                        {d.ownerEmail ? `Owner: ${d.ownerEmail} · ` : ""}
                        {d.department || "No department"} · Updated {format(new Date(d.updatedAt), "PP p")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end gap-2 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(d.id)}
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
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
