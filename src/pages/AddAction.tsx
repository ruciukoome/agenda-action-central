import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ActionForm } from "@/components/ActionForm";
import { ActionItem } from "@/types/action";
import { toast } from "@/lib/toast-wrapper";
import { createAction } from "@/lib/actions";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  createDraft,
  deleteDraft,
  getDraft,
  listDrafts,
  updateDraft,
  ActionDraft,
} from "@/lib/drafts";

export default function AddAction() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdParam = searchParams.get("draftId") || undefined;

  const [draftId, setDraftId] = useState<string | undefined>(draftIdParam);
  const [initialDraft, setInitialDraft] = useState<Partial<ActionItem> | undefined>();
  const [draftCount, setDraftCount] = useState(0);
  const [loadingDraft, setLoadingDraft] = useState(!!draftIdParam);

  useEffect(() => {
    listDrafts()
      .then((d) => setDraftCount(d.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!draftIdParam) {
      setInitialDraft(undefined);
      setDraftId(undefined);
      return;
    }
    setLoadingDraft(true);
    getDraft(draftIdParam)
      .then((d) => {
        if (!d) {
          toast.error("Draft not found");
          navigate("/add-action", { replace: true });
          return;
        }
        setDraftId(d.id);
        setInitialDraft(draftToActionItem(d));
      })
      .catch((e) => toast.error("Failed to load draft", { description: e.message }))
      .finally(() => setLoadingDraft(false));
  }, [draftIdParam, navigate]);

  const handleSave = async (action: ActionItem) => {
    try {
      await createAction(action);
      if (draftId) {
        try {
          await deleteDraft(draftId);
        } catch (e) {
          console.error("Failed to delete draft after submit", e);
        }
      }
      toast.success("Action created", {
        description: "Your new action item has been created successfully.",
      });
      document.body.style.pointerEvents = "";
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        navigate("/app");
      }, 0);
    } catch (error) {
      console.error("Failed to create action:", error);
      toast.error("Error", {
        description: "Failed to create action. Please try again.",
      });
    }
  };

  const handleSaveDraft = async (values: Partial<ActionItem>) => {
    try {
      const payload = {
        meetingTitle: values.meetingTitle,
        description: values.description,
        department: values.department,
        meetingDate: values.meetingDate,
        priority: values.priority,
        ownerEmail: values.ownerEmail,
        progressStatus: values.progressStatus,
        notes: values.notes,
        dueDate: values.dueDate,
        ccEmails: values.ccEmails,
        bccEmails: values.bccEmails,
      };
      if (draftId) {
        await updateDraft(draftId, payload);
        toast.success("Draft updated");
      } else {
        const created = await createDraft(payload);
        setDraftId(created.id);
        setSearchParams({ draftId: created.id }, { replace: true });
        setDraftCount((c) => c + 1);
        toast.success("Saved as draft", {
          description: "You can resume this from My Drafts at any time.",
        });
      }
    } catch (e: any) {
      toast.error("Failed to save draft", { description: e.message });
    }
  };

  if (loadingDraft) {
    return (
      <AppLayout title="Loading draft...">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={draftId ? "Resume Draft" : "Add New Action Item"}>
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-lg bg-info">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-white/20 backdrop-blur p-3 ring-1 ring-white/30 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                {draftId ? "Resuming draft" : "New action item"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {draftId ? "Pick up where you left off" : "Capture a new action"}
              </h2>
              <p className="text-sm text-white/85 mt-1 max-w-xl">
                Add details, assign an owner, and save as a draft if you need to pause.
              </p>
            </div>
          </div>
        </div>
        <ActionForm
          key={draftId || "new"}
          draftId={draftId}
          initialDraft={initialDraft}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
          onOpenDrafts={() => navigate("/drafts")}
          draftCount={draftCount}
        />
      </div>
    </AppLayout>
  );
}

function draftToActionItem(d: ActionDraft): Partial<ActionItem> {
  return {
    meetingTitle: d.meetingTitle,
    description: d.description,
    department: d.department,
    meetingDate: d.meetingDate,
    priority: d.priority,
    ownerEmail: d.ownerEmail,
    progressStatus: d.progressStatus,
    notes: d.notes,
    dueDate: d.dueDate,
    ccEmails: d.ccEmails,
    bccEmails: d.bccEmails,
  };
}
