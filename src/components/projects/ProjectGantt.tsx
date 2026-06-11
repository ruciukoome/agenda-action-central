import { ProjectStage } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface Props {
  stages: ProjectStage[];
  /** Optional swimlane label per row (e.g. project title for org-wide view). */
  rowLabels?: string[];
  compact?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  locked: "bg-muted text-muted-foreground",
  ready: "bg-blue-500 text-white",
  in_progress: "bg-indigo-500 text-white",
  completed: "bg-emerald-500 text-white",
  overdue: "bg-rose-500 text-white",
};

function dateToMs(d: string | null): number | null {
  if (!d) return null;
  return new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).getTime();
}

/**
 * Minimal SVG-free Gantt: each stage is a row with a bar laid out by % of total span.
 * Planned span shown as light bar; actual progress overlay solid.
 */
export function ProjectGantt({ stages, rowLabels, compact = false }: Props) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No stages yet.</p>;
  }

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
        {/* Header timeline */}
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
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-48 shrink-0 truncate text-sm" title={label}>
                  <span className="font-medium">{label}</span>
                  {!compact && (
                    <div className="text-[11px] text-muted-foreground truncate">{s.owner_email}</div>
                  )}
                </div>
                <div className="flex-1 relative h-7 bg-muted/40 rounded">
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 rounded px-2 text-[11px] flex items-center font-medium shadow-sm",
                      STATUS_COLOR[s.status] ?? "bg-primary text-primary-foreground",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${s.status} · ${s.progress_status}`}
                  >
                    <span className="truncate">{s.progress_status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
