## Goal

Only the action owner can update an action point. CC/BCC recipients are followers — they get a view-only notification and cannot update. Replying to the notification email will no longer be the update mechanism; instead, the owner gets a secure one-time link in their email that opens the existing `/update-task/:id?token=...` page.

## Changes

### 1. `supabase/functions/send-action-notification/index.ts`
- For every send, generate a secure update token by inserting into `public.action_tokens` (used: false, expires in 14 days, with `action_data` snapshot — matches the shape `UpdateTask.tsx` already consumes via `get_action_token_by_id_and_token`).
- Build two email variants:
  - **Owner email** (To: owner): includes a prominent "Update this action" button → `{APP_URL}/update-task/{id}?token={token}`. Body text reads: "Use the secure link below to update progress. Replies to this email are not monitored."
  - **Follower email** (To: each CC + BCC recipient): view-only summary. No update link. Body text reads: "You are receiving this as a follower (CC/BCC). Only the action owner can update progress."
- Send the owner email and follower email as separate Resend requests so the update link is never exposed to CC/BCC.
- Use `APP_URL` env var (fallback to `https://actioncentral.platinumcredit.co.ke`) to build the link.
- Remove the "Kindly reply to this email for updates" instruction from all templates (assigned / updated / due_soon / overdue / default).

### 2. `src/lib/notifications.ts`
- No behavioral change needed in the caller — it already passes `ccEmails` / `bccEmails`. Toast message text updated to reflect that follower emails were also dispatched.

### 3. No DB schema changes
- `action_tokens` table and `get_action_token_by_id_and_token` RPC already exist and are used by `UpdateTask.tsx`. The edge function will insert tokens using the service role (via `SUPABASE_SERVICE_ROLE_KEY`) — confirm the env var is available; if not, switch the supabase client init in the function to use the service role key (required for inserting tokens server-side regardless of caller).

### 4. Email copy
- Owner subject unchanged ("New Action Item Assigned: …").
- Follower subject prefixed with "[FYI] " so recipients immediately see they are not the owner (e.g. "[FYI] New Action Item Assigned: …").

## Out of scope
- No UI changes to the app pages.
- No changes to the `UpdateTask` flow itself — it already validates the token, applies updates, and marks the token used.
- No restriction changes to in-app permissions (CC/BCC users who happen to also be app users already have their own RLS-scoped views).
