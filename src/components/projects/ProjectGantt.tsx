import { ProjectStage } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface Props {
  stages: ProjectStage[];
  rowLabels?: string[];
  compact?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  locked: "bg-muted text-muted-foreground border border-dashed border-muted-foreground/40",
  ready: "bg-blue-500 text-white",
  in_progress: "bg-indigo-500 text-white",
  completed: "bg-emerald-500 text-white",
  overdue: "bg-rose-500 text-white",
};

function dateToMs(d: string | null): number | null {
  if (!d) return null;
  return new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).getTime();
}

export function ProjectGantt({ stages, rowLabels, compact = false }: Props) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No stages yet.</p>;
  }

  const byId = new Map(stages.map((s) => [s.id, s]));
  const starts = stages.map((s) => dateToMs(s.planned_start_date)).filter((v): v is number => v !== null);
  const ends = stages.map((s) => dateToMs(s.planned_end_date)).filter((v): v is number => v !== null);
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = Math.max(1, max - min);

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <div className="w-48 shrink-0" />
          <div className="flex-1 flex justify-between">
            <span>{fmt(min)}</span>
            <span>{fmt(min + span / 2)}</span>
            <span>{fmt(max)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {stages.map((s, idx) => {
            const ps = dateToMs(s.planned_start_date) ?? min;
            const pe = dateToMs(s.planned_end_date) ?? ps;
            const left = ((ps - min) / span) * 100;
            const width = Math.max(2, ((pe - ps) / span) * 100);
            const label = rowLabels?.[idx] ?? `${s.sequence}. ${s.title}`;
            const isLocked = s.status === "locked";
            const dep = s.depends_on_stage_id ? byId.get(s.depends_on_stage_id) : null;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-48 shrink-0 truncate text-sm" title={label}>
                  <span className="font-medium flex items-center gap-1">
                    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className="truncate">{label}</span>
                  </span>
                  {!compact && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {isLocked && dep
                        ? `Waiting on ${dep.owner_email}`
                        : s.owner_email}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative h-7 bg-muted/40 rounded">
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 rounded px-2 text-[11px] flex items-center font-medium shadow-sm",
                      STATUS_COLOR[s.status] ?? "bg-primary text-primary-foreground",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={
                      isLocked && dep
                        ? `Locked — waiting on stage ${dep.sequence} (${dep.owner_email})`
                        : `${s.status} · ${s.progress_status}`
                    }
                  >
                    {isLocked && <Lock className="h-3 w-3 mr-1 shrink-0" />}
                    <span className="truncate">
                      {isLocked && dep ? `Waiting on stage ${dep.sequence}` : s.progress_status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Legend:</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-blue-500" /> Ready</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-indigo-500" /> In progress</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-emerald-500" /> Completed</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-rose-500" /> Overdue</span>
          <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> Locked (waiting on dependency)</span>
          <span className="w-full sm:w-auto sm:ml-2 sm:pl-3 sm:border-l">
            <strong className="text-foreground">Duration (days)</strong> sets each bar's length and determines its planned end date — the next stage's planned start date is the previous stage's end date.
          </span>
        </div>
      </div>
    </div>
  );
}

