## Collaborative Projects with Gantt

Introduce a new "Collaborative Project" entity made up of ordered **stages**, each assigned upfront to a different owner. All participants see their stage from day one, but a stage is **locked** until the previous one is marked 100%. On handoff: the next owner is emailed, the project owner is CC'd, and overrun alerts fire when a stage exceeds its planned duration.

### Data model (new tables)

- `collaborative_projects`
  - `organization_id`, `created_by`, `owner_user_id` (project lead), `title`, `description`, `start_date`, `status` ('planning' | 'active' | 'completed' | 'cancelled')
- `project_stages`
  - `project_id`, `sequence` (int, 1..N), `title`, `skill_required`, `owner_email`, `owner_user_id` (nullable), `planned_duration_days`, `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`, `status` ('locked' | 'ready' | 'in_progress' | 'completed' | 'overdue'), `progress_status` (reuse existing enum), `notes`, `action_id` (FK → `actions`, nullable)
- Reuse existing `actions` table: one action row is created per stage at project creation, linked back via `project_stages.action_id`. This keeps the Kanban/My Actions views working unchanged.

RLS: org-scoped via `is_org_member`, mirroring `actions`. Standard GRANTs for `authenticated` + `service_role`.

### Lifecycle / handoff logic

Implemented in a Postgres trigger on `project_stages` (and a small companion trigger on `actions` so existing UI completion flows propagate):

1. Project creation: all stages inserted, sequence 1 → `ready`, sequence > 1 → `locked`. Planned dates computed from `start_date` + cumulative `planned_duration_days` (hybrid model). Matching `actions` rows are created and linked.
2. When a stage's `progress_status` becomes `100%` (or the linked action is marked completed):
   - Stage → `completed`, `actual_end_date = now()`.
   - Next stage → `ready`, `actual_start_date = now()`, planned end recomputed from its planned duration so downstream stages shift (hybrid behavior).
   - Edge function `notify-stage-handoff` is invoked: emails next owner (assignment-style) and CCs project owner.
3. Daily cron (extend existing `send-due-date-reminders` schedule) flags stages where `now() > planned_end_date AND status <> 'completed'` → `overdue`, emails current owner + project owner.

The action linked to a locked stage is marked read-only in the UI (badge "Waiting on <previous owner>") so dependent owners see context but can't tick it off early.

### Edge functions

- `notify-stage-handoff` (new): sends handoff + project-owner CC emails (reuses existing SendGrid/Resend setup and `get_effective_email_pref`).
- `check-stage-overruns` (new, cron): nightly scan + alert emails.
- `send-action-notification` (existing): no change; stage 1 owners get the standard assignment email via the linked action.

### UI

- **New page `/projects`**: list of collaborative projects with status, owner, % complete, next handoff date. "New Project" wizard collects title, project owner, start date, then a repeatable stage row (title, skill, owner email, planned days). Edit + reorder before activation.
- **Project detail page `/projects/:id`**: Gantt chart (per-project) showing each stage as a bar — planned bar (light) overlaid with actual bar (solid), color-coded by status (locked/ready/in-progress/completed/overdue). Click bar → opens linked action drawer.
- **Org-wide Gantt** on Dashboard: new "Project Timeline" section under existing stats, swimlane per project, same bar styling, filter by owner/status.
- **Action card enhancement**: actions tied to a stage show a small "Project · Stage X of N" chip and (when locked) a lock badge with the previous owner's name.
- **Sidebar**: add "Projects" nav entry between "Managed Actions" and "Compliance Report".

Gantt rendered with a lightweight custom SVG/flex implementation (no new heavy dep) using design tokens; horizontal scroll on mobile.

### Notifications & preferences

- New email-pref keys: `project_stage_assignment`, `project_handoff`, `project_overrun`. Defaults: all `true`. Surface toggles in existing `EmailIntegrationCard` (user) and org email settings (admin).

### Out of scope (not in this iteration)

- Parallel/branching dependencies (only strict sequential chains).
- Drag-to-reschedule on the Gantt (read-only timeline first; edit via stage form).
- File attachments per stage.

### Technical notes

- New tables + enums (`project_status`, `stage_status`) created in a single migration with GRANTs and RLS as specified.
- Update of `src/integrations/supabase/types.ts` happens automatically after migration approval.
- New hook `useCollaborativeProjects` and lib folder `src/lib/projects/` mirroring `src/lib/actions/` patterns.
- All toasts go through `toast-wrapper`; multi-tenancy enforced by `organization_id` + RLS per existing conventions.
