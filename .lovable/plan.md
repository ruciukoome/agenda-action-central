## Goal

When an action point is created and emailed, also attach an ICS calendar invite (so everyone on owner + CC + BCC can add it to their calendar), and give the owner in-app Accept / Reject buttons that update the action's status.

## Changes

### 1. Database (migration)

Add to `public.actions`:
- `owner_response` enum (`pending` | `accepted` | `rejected`) default `pending`
- `owner_responded_at` timestamptz nullable

Extend `action_tokens` purpose so a single token works for both "update" and "respond" (or add a `purpose` text column with default `'update'`). The existing `get_action_token_by_id_and_token` RPC stays compatible.

### 2. Edge function: `send-action-notification`

In `supabase/functions/send-action-notification/index.ts`:

- Build an ICS string (`VCALENDAR` / `VEVENT`):
  - `UID` = `action.id@actioncentral`
  - `SUMMARY` = action title / description (first line)
  - `DESCRIPTION` = action description + notes
  - `DTSTART` / `DTEND` = `meeting_date` (1h block) or `due_date` fallback
  - `ORGANIZER` = creator
  - `ATTENDEE` lines for owner + every CC + every BCC (all marked `REQ-PARTICIPANT`, `RSVP=TRUE`)
  - `METHOD:REQUEST` so mail clients show Accept/Decline
- Attach the ICS to BOTH the owner email and the followers email via Resend `attachments: [{ filename: 'invite.ics', content: base64, content_type: 'text/calendar; method=REQUEST' }]`.
- Owner email keeps the existing tokenized "Update this action" button AND adds two new tokenized buttons:
  - `Accept` → `{APP_URL}/respond/{actionId}?token={token}&decision=accept`
  - `Reject` → `{APP_URL}/respond/{actionId}?token={token}&decision=reject`
- Followers email stays FYI-only (no buttons), but now includes the ICS attachment.
- Note in the followers email: "BCC recipients are visible to other attendees on the calendar invite." (since user chose 'everyone as attendees').

### 3. New page: `/respond/:actionId`

`src/pages/RespondAction.tsx`:
- Reads `token` + `decision` from URL.
- Calls a new edge function `respond-action` that:
  - Validates token via `get_action_token_by_id_and_token` RPC (service role).
  - Updates `actions.owner_response`, `owner_responded_at`, and on reject sets `progress_status='Not Started'`; on accept leaves progress untouched.
  - Marks token `used=true`.
- Shows a confirmation card ("Thanks — your response was recorded").

Add the route to `src/App.tsx`.

### 4. UI surfacing

On the action detail / list view, show a small badge: `Owner: Accepted` / `Owner: Rejected` / `Awaiting owner response` based on `owner_response`.

## Out of scope

- Real Google Calendar / Meet integration (no live Meet link will be generated — the ICS is a static calendar invite that any client can RSVP to).
- Two-way RSVP sync from the user's calendar back into the app. Calendar RSVPs go to the organizer's mailbox only; the in-app Accept / Reject buttons are the source of truth for `owner_response`.

## Technical notes

- ICS must use CRLF line endings and fold lines >75 octets.
- For the followers email, the ICS is informational (their RSVP won't reach us); the in-app Accept/Reject is owner-only.
- Token reuse: same token used for update-link and accept/reject buttons → bump `expires_at` to 30 days and keep `used=false` until any of the three actions consumes it. (Or issue separate tokens — simpler to use one.)
