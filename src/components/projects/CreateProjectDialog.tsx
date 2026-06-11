import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast-wrapper";
import { createProjectWithStages, NewStageInput } from "@/lib/projects";
import { useOrganization } from "@/contexts/OrganizationContext";

interface Props {
  onCreated: (projectId: string) => void;
}

export function CreateProjectDialog({ onCreated }: Props) {
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [stages, setStages] = useState<NewStageInput[]>([
    { title: "", owner_email: "", planned_duration_days: 3, skill_required: "" },
  ]);

  const updateStage = (i: number, patch: Partial<NewStageInput>) =>
    setStages((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const submit = async () => {
    if (!organization) return;
    if (!title.trim() || !ownerEmail.trim()) {
      toast.error("Title and project owner are required");
      return;
    }
    if (stages.some((s) => !s.title.trim() || !s.owner_email.trim() || s.planned_duration_days < 1)) {
      toast.error("Every stage needs a title, owner email, and duration ≥ 1 day");
      return;
    }
    try {
      setSubmitting(true);
      const id = await createProjectWithStages({
        organization_id: organization.id,
        title: title.trim(),
        description: description.trim() || undefined,
        owner_email: ownerEmail.trim(),
        start_date: startDate,
        stages,
      });
      toast.success("Project created", { description: "Stage 1 owner has been notified." });
      setOpen(false);
      onCreated(id);
    } catch (e: any) {
      toast.error("Failed to create project", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Collaborative Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 Loan Product Launch" />
            </div>
            <div className="space-y-1.5">
              <Label>Project owner email</Label>
              <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="lead@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Stages (in order)</h4>
              <Button type="button" variant="outline" size="sm" onClick={() =>
                setStages((s) => [...s, { title: "", owner_email: "", planned_duration_days: 3, skill_required: "" }])
              }>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add stage
              </Button>
            </div>

            {stages.map((s, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Stage {i + 1}</span>
                  {stages.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() =>
                      setStages((arr) => arr.filter((_, idx) => idx !== i))
                    }>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Stage title</Label>
                    <Input placeholder="e.g. Design review" value={s.title} onChange={(e) => updateStage(i, { title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Owner email</Label>
                    <Input type="email" placeholder="owner@company.com" value={s.owner_email} onChange={(e) => updateStage(i, { owner_email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Skill required (optional)</Label>
                    <Input placeholder="e.g. Legal review" value={s.skill_required ?? ""} onChange={(e) => updateStage(i, { skill_required: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="3"
                      value={s.planned_duration_days}
                      onChange={(e) => updateStage(i, { planned_duration_days: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-[10px] text-muted-foreground">How many days this stage is planned to take.</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Creating..." : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
