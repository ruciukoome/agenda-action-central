import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { CollaborativeProject, fetchProjects } from "@/lib/projects";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  planning: "outline",
  active: "default",
  completed: "secondary",
  cancelled: "outline",
};

export default function Projects() {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<CollaborativeProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      setProjects(await fetchProjects(organization.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [organization?.id]);

  return (
    <AppLayout title="Collaborative Projects">
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Multi-stage projects where each owner picks up after the previous one completes.
          </p>
          <CreateProjectDialog onCreated={(id) => { load(); navigate(`/projects/${id}`); }} />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <h3 className="text-lg font-medium mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground">Create your first collaborative project to start a handoff chain.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <Card
                key={p.id}
                className="p-4 cursor-pointer hover:bg-muted/40 transition"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Owner: {p.owner_email} · Started {new Date(p.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
