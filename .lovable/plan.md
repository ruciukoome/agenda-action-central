## Goal
Turn the Email Notifications card from a UI mock into real, persisted preferences that actually gate when emails are sent. Support an org-level default with per-user overrides.

## Settings model

Four functional toggles + one placeholder:

| Setting | Effect | Default |
|---|---|---|
| Assignment notifications | Skip the "assigned" email in `createAction.ts` | on |
| Completion updates | Skip the "completed" email in `QuickStatusUpdate` and `UpdateTask` | on |
| Due date reminders / Automatic reminders | Skip the per-action reminder inside `send-due-date-reminders` | on |
| Weekly digest | New Sunday email summarising the user's open/overdue actions | off |
| Overdue alerts | Keep as visible placeholder, disabled with "Coming soon" badge | — |

Resolution rule when sending: **user override (if set) else org default else built‑in default (on)**. The assigner's preference governs assignment/completion/digest emails (these are their notifications); the owner's preference governs due-date reminders (the reminder is for the owner).

## Database

New migration adds two tables (with grants + RLS):

```text
organization_email_settings
  organization_id uuid PK -> organizations(id)
  assignment_notifications  bool default true
  completion_updates        bool default true
  due_date_reminders        bool default true
  weekly_digest             bool default false
  updated_at, updated_by

user_email_settings
  user_id uuid PK
  organization_id uuid       -- scope the override
  assignment_notifications  bool null   -- null = inherit
  completion_updates        bool null
  due_date_reminders        bool null
  weekly_digest             bool null
  updated_at
```

RLS:
- `organization_email_settings`: select for org members; insert/update only for org admins (`get_user_org_role = 'admin'`).
- `user_email_settings`: each user manages their own row (`user_id = auth.uid()`).

Helper SQL function `public.get_effective_email_pref(_user_id uuid, _org_id uuid, _key text) returns bool` (SECURITY DEFINER) so edge functions can resolve preferences in one call.

## Frontend

`EmailIntegrationCard.tsx` becomes the real settings UI:
- Load org defaults + my overrides via a new `useEmailSettings()` hook.
- **Settings tab** lists the four functional toggles. Each shows: current effective value, override switch ("Use org default" / "On" / "Off") tri-state via a small select; admins see an extra "Org default" switch above it.
- **Overdue alerts** row stays in Overview list but its Settings switch is disabled with a "Coming soon" badge.
- Save on change; toast via `toast-wrapper`.

`Settings.tsx` already renders Toast settings; add `EmailIntegrationCard` underneath so users reach it from /settings (currently it's only used elsewhere). No change to existing nav.

## Send-site gating

- `src/lib/actions/createAction.ts`: before `sendActionNotification(..., "assigned")`, fetch assigner's effective `assignment_notifications`; skip if false.
- `src/components/QuickStatusUpdate.tsx` + `src/pages/UpdateTask.tsx`: before completion notification, fetch assigner's effective `completion_updates` (UpdateTask is public — call a small new edge function `get-notification-pref` with the `actionToken` to look it up server-side; no client auth needed).
- `supabase/functions/send-due-date-reminders/index.ts`: for each action, look up the owner's effective `due_date_reminders` via the helper and skip if false.

## Weekly digest (new)

- New edge function `send-weekly-digest` (Sundays 08:00 UTC via pg_cron). For every user with effective `weekly_digest = true`, query their open actions (assigned to them + assigned by them, grouped), render an HTML summary, send via existing Resend setup (`info@nafarrosolutions.com`, reply-to = user).
- Cron entry added via the `insert` tool (not migration) so the URL/anon key stay project-specific.

## Out of scope
- Changing the sending domain
- Overdue alerts behaviour (placeholder only)
- Backfilling settings rows (defaults applied lazily)

## Files touched
- New: `supabase/migrations/<ts>_email_settings.sql`, `src/hooks/useEmailSettings.ts`, `supabase/functions/get-notification-pref/index.ts`, `supabase/functions/send-weekly-digest/index.ts`
- Edited: `src/components/EmailIntegrationCard.tsx`, `src/pages/Settings.tsx`, `src/lib/actions/createAction.ts`, `src/components/QuickStatusUpdate.tsx`, `src/pages/UpdateTask.tsx`, `supabase/functions/send-due-date-reminders/index.ts`
