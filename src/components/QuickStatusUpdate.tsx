import { useState } from "react";
import { ActionItem, ProgressStatus } from "@/types/action";
import { updateAction } from "@/lib/actions";
import { sendActionNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-wrapper";

interface QuickStatusUpdateProps {
  action: ActionItem;
  onUpdated?: (updated: ActionItem) => void;
  /** Render as inline pill button instead of icon */
  variant?: "icon" | "pill";
  className?: string;
}

const PROGRESS_OPTIONS: ProgressStatus[] = [
  "Not Started",
  "25%",
  "50%",
  "75%",
  "100%",
  "Continuous",
];

const progressStyles: Record<string, string> = {
  "Not Started": "bg-blue-100 text-blue-700 hover:bg-blue-200",
  "25%": "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  "50%": "bg-violet-100 text-violet-700 hover:bg-violet-200",
  "75%": "bg-teal-100 text-teal-700 hover:bg-teal-200",
  "100%": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  Continuous: "bg-sky-100 text-sky-700 hover:bg-sky-200",
};

export function QuickStatusUpdate({
  action,
  onUpdated,
  variant = "icon",
  className,
}: QuickStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<ProgressStatus>(action.progressStatus);
  const [completed, setCompleted] = useState(action.completed);
  const [confirmException, setConfirmException] = useState<{ progress: ProgressStatus } | null>(null);

  const handleProgressChange = async (next: ProgressStatus) => {
    // Block lowering progress while completed unless user confirms an exception
    if (completed && next !== "100%" && next !== "Continuous") {
      setConfirmException({ progress: next });
      return;
    }
    setProgress(next);
    const isComplete = next === "100%";
    if (isComplete) setCompleted(true);
    await persist({ progressStatus: next, completed: isComplete || completed });
  };

  const handleCompletedChange = async (checked: boolean) => {
    // Marking complete with low progress -> auto-bump to 100%
    if (checked && progress !== "100%" && progress !== "Continuous") {
      setCompleted(true);
      setProgress("100%");
      await persist({ completed: true, progressStatus: "100%" });
      return;
    }
    setCompleted(checked);
    const nextProgress: ProgressStatus = checked
      ? "100%"
      : progress === "100%"
      ? "75%"
      : progress;
    setProgress(nextProgress);
    await persist({ completed: checked, progressStatus: nextProgress });
  };

  const confirmExceptionApply = async () => {
    if (!confirmException) return;
    const next = confirmException.progress;
    setConfirmException(null);
    setProgress(next);
    await persist({ progressStatus: next, completed: true });
  };

  const persist = async (patch: Partial<ActionItem>) => {
    setSaving(true);
    try {
      const wasCompleted = action.completed || action.progressStatus === "100%";
      const updated = await updateAction({ ...action, ...patch });
      const nowCompleted = updated.completed || updated.progressStatus === "100%";
      toast.success("Status updated");
      onUpdated?.(updated);
      if (!wasCompleted && nowCompleted) {
        sendActionNotification(updated, "completed").catch((e) => console.error(e));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
      // revert local state on error
      setProgress(action.progressStatus);
      setCompleted(action.completed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          {variant === "pill" ? (
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                progressStyles[progress] ?? progressStyles["Not Started"],
                className
              )}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {completed ? "Completed" : progress}
            </button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 shrink-0", className)}
              aria-label="Quick update status"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-60 p-3"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Progress
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PROGRESS_OPTIONS.map((opt) => {
                  const active = progress === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={saving}
                      onClick={() => handleProgressChange(opt)}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-border"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {completed && (
                <p className="text-[11px] text-amber-700 mt-2">
                  Action is completed. Lowering progress requires confirmation.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <Checkbox
                id={`completed-${action.id}`}
                checked={completed}
                disabled={saving}
                onCheckedChange={(c) => handleCompletedChange(Boolean(c))}
              />
              <Label
                htmlFor={`completed-${action.id}`}
                className="text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Mark as completed
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={confirmException !== null}
        onOpenChange={(o) => !o && setConfirmException(null)}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Allow completion exception?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is marked as <strong>completed</strong>. Setting
              progress to <strong>{confirmException?.progress}</strong> will
              create a mismatch. Continue only if you explicitly want to allow
              this exception.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExceptionApply}>
              Allow exception
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
