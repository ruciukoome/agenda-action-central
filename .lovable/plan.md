## Issues confirmed

**1. No email sent when a project stage is assigned.**
`createProjectWithStages` (src/lib/projects/index.ts) inserts `actions` rows directly with the DB client — it bypasses `createAction`, which is the only place that calls `sendActionNotification`. So stage owners (including stage 1) never get the "you've been assigned" email, and the existing `send-due-date-reminders` cron can't help if they don't even know the task exists.

**2. "tuple to be updated was already modified…" error on second progress update.**
The two DB triggers fight each other:

- `handle_stage_progress_change` runs BEFORE UPDATE on `project_stages`. When a stage hits 100% it updates the linked row in `actions`.
- `sync_action_to_stage` runs on `actions` updates and writes back into `project_stages` — including the same stage row whose BEFORE trigger is still executing. Postgres aborts with "tuple to be updated was already modified by an operation triggered by the current command".

This is why the very first update of stage 1 (Not Started → 50%) works, but the next change fails — by then the action row exists in a state that makes `sync_action_to_stage` want to write back.

## Plan

### A. Send assignment emails when a project is created

In `src/lib/projects/index.ts` `createProjectWithStages`, after stages are inserted, call `sendActionNotification(createdAction, "assigned")` for every stage owner using the action rows already created. Wrap in try/catch so an email failure never aborts project creation. This immediately gives stage owners the same assignment email standalone actions get, and `send-due-date-reminders` will then pick them up for upcoming-deadline notices.

### B. Stop the trigger recursion

Add a migration that hardens both functions with `pg_trigger_depth()` guards so neither re-enters the other:

- `public.sync_action_to_stage()` — at the top, `IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;` so it only runs when a user/app changes `actions` directly, not when our stage trigger cascaded into it.
- `public.handle_stage_progress_change()` — wrap the `UPDATE public.actions …` in the same guard so a cascade from `sync_action_to_stage` can't bounce back.

Keep both triggers' real work intact (status flip to completed, unlocking dependents, calling `notify-stage-handoff`, syncing the linked action when the user edits the action card directly).

### C. Verify

1. Create a fresh project with 2–3 stages → confirm stage 1 owner receives the assignment email; project owner sees toast.
2. Stage 1 owner moves progress 25% → 50% → 75% → 100% in sequence with no "tuple… already modified" error.
3. On 100%, stage 2 unlocks and its owner receives the handoff email (existing `notify-stage-handoff`).
4. Repeat for stage 2 → stage 3 to confirm the chain works end-to-end.

## Out of scope

- Reworking `updateAction` permissions (only the action creator can update standalone actions). Project stages are updated via `updateStageProgress` on `project_stages` directly, so that path is unaffected.
- Changes to the Resend/Lovable email connector configuration — assumed already working since standalone action assignments already send.
