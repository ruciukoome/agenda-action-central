import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  CollaborativeProject, ProjectStage, ProgressStatus,
  fetchProject, fetchStages, updateStageProgress, updateStageDependency,
} from "@/lib/projects";
import { ProjectGantt } from "@/components/projects/ProjectGantt";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast-wrapper";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

const PROGRESS_OPTIONS: ProgressStatus[] = ["Not Started", "25%", "50%", "75%", "100%"];

const STATUS_BADGE: Record<string, string> = {
  locked: "bg-muted text-muted-foreground",
  ready: "bg-blue-500 text-white",
  in_progress: "bg-indigo-500 text-white",
  completed: "bg-emerald-500 text-white",
  overdue: "bg-rose-500 text-white",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CollaborativeProject | null>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState<string>("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, s, u] = await Promise.all([
        fetchProject(id),
        fetchStages(id),
        supabase.auth.getUser(),
      ]);
      setProject(p);
      setStages(s);
      setCurrentEmail(u.data.user?.email ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleProgress = async (stage: ProjectStage, value: ProgressStatus) => {
    try {
      await updateStageProgress(stage.id, value);
      toast.success("Stage updated");
      load();
    } catch (e: any) {
      toast.error("Update failed", { description: e?.message });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Project">
        <div className="container py-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project">
        <div className="container py-6">Project not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={project.title}>
      <div className="container py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Button>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{project.title}</h2>
              {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Project owner: {project.owner_email} · Started {new Date(project.start_date).toLocaleDateString()}
              </p>
            </div>
            <Badge>{project.status}</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Timeline</h3>
          <ProjectGantt stages={stages} />
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Stages</h3>
          <div className="space-y-2">
            {stages.map((s) => {
              const isMine = currentEmail && s.owner_email.toLowerCase() === currentEmail.toLowerCase();
              const canEdit = isMine && s.status !== "locked" && s.status !== "completed";
              return (
                <div key={s.id} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.sequence}. {s.title}</span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_BADGE[s.status]}`}>
                        {s.status === "locked" && <Lock className="inline h-2.5 w-2.5 mr-1" />}
                        {s.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {s.owner_email}
                      {s.skill_required && ` · ${s.skill_required}`}
                      {s.planned_start_date && ` · ${s.planned_start_date} → ${s.planned_end_date}`}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {canEdit ? (
                      <Select value={s.progress_status} onValueChange={(v) => handleProgress(s, v as ProgressStatus)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROGRESS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">{s.progress_status}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
