# Reply-To assigner + completion notifications

## Goals

1. When the owner (email B) replies to an action email, the reply must go to the assigner (email A), not the shared sending mailbox (email C, `info@nafarrosolutions.com`).
2. When an action is marked complete by the owner, the assigner gets an email notifying them.

## Changes

### 1. Reply-To becomes the assigner's email

`send-action-notification` already receives `senderEmail` (the logged-in assigner) in its payload. Today it ignores it for `reply_to` and uses `info@nafarrosolutions.com`.

- Use `senderEmail` as `reply_to` on both the owner email and the follower (CC/BCC) email when it is a valid address. Fall back to `info@nafarrosolutions.com` only if `senderEmail` is missing/invalid.
- Keep `from` as the verified sending domain (email C) — required for deliverability/DKIM. Only `reply_to` changes.
- Add a short line in the email body telling the owner that hitting Reply will email the person who assigned the action (the assigner's address shown).

### 2. Notify assigner when the action is completed

Trigger: an action transitions to completed (either `completed = true` or `progress_status = '100%'`) and was not already in that state.

Two entry points must both send the notification:

a. **Owner secure update flow** (`src/pages/UpdateTask.tsx`):
   - After the successful update, if the new state is "completed" and the previous state wasn't, invoke `send-action-notification` with a new type `"completed"`.
   - Because this page is token-gated and the visitor is not logged in, the edge function must accept this call without a user JWT for type `completed` only, and must look up the assigner's email server-side (see edge-function changes below). We will call it with the anon key from the page.

b. **In-app updates** (`updateAction.ts` / wherever progress is edited while logged in, e.g. `QuickStatusUpdate`):
   - After update, compare old vs new; if it just became completed, call `sendActionNotification(action, "completed")` from the client. The edge function will route the email to the assigner.

### 3. Edge function `send-action-notification` updates

- Accept new `type: "completed"`.
- For `completed`:
  - Look up the action's `user_id` (assigner) via the service-role client, then resolve their email via `auth.admin.getUserById(user_id)`.
  - Send a single email **to the assigner** with subject like `Action completed by {ownerEmail}: {short description}` and a summary (description, owner, progress, notes, completion timestamp). No Accept/Reject/Update CTAs. No ICS.
  - Set `reply_to` to the owner's email (so the assigner can reply directly to the person who completed it).
  - Skip the existing owner/follower send paths for this type.
- Relax auth for the `completed` type only: allow the call when the JWT is missing **and** the request includes a valid, unused `actionToken` matching the action (so the public UpdateTask page can trigger it). All other types keep the current Bearer-JWT requirement.
- For all other types: set `reply_to = senderEmail` (assigner) when valid; keep `info@nafarrosolutions.com` as the From and as the fallback reply-to.

### 4. Email copy tweak (minor)

In the owner email body, replace the line saying replies are not monitored with: "Replies to this email will go to the person who assigned this action ({assignerEmail})." Keep the "automated message" footer.

## Out of scope

- Changing the verified sending domain.
- Notifying assigner on Accept/Reject (already handled separately).
- Re-sending completion notices if the action is later re-opened and re-completed (we only fire on the not-completed → completed transition).
- Backfilling notifications for historical completions.

## Files touched

- `supabase/functions/send-action-notification/index.ts` — new `completed` branch, conditional auth, reply-to logic, assigner lookup.
- `src/lib/notifications.ts` — extend `type` union with `"completed"`; allow optional override of recipient resolution for completion (assigner lookup happens server-side, so client just passes the action + type).
- `src/pages/UpdateTask.tsx` — detect completion transition, invoke edge function with action token.
- `src/lib/actions/updateAction.ts` (and `QuickStatusUpdate.tsx` if it updates progress) — detect completion transition for logged-in updates and trigger the notification.
