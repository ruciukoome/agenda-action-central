
## Goal

Replace the current "every action auto-generates an ICS for now()" behavior with an explicit, creator-controlled choice:

1. **Task only** — owner gets the existing notification + Accept/Reject, no calendar invite.
2. **New meeting** — creator schedules a meeting (date, start, end, location/notes, timezone). ICS is generated and attached.
3. **Attach to existing meeting** — creator picks a meeting they previously created (or any meeting in their organization). The same ICS UID is reused so all attached actions appear as one event in attendees' calendars, with each owner added as an attendee.

Existing actions are left as-is.

## User flow

In `ActionForm`, add a "Meeting" section with a three-way selector:

```text
( ) Task only — owner just gets an email + Accept/Reject
( ) Schedule a new meeting
( ) Attach to existing meeting
```

- Task only: no extra fields.
- New meeting: date, start time, end time, timezone (default browser), location/notes (free text). On save, a row is inserted into `meetings` and linked to the action.
- Existing meeting: searchable dropdown of meetings in the user's organization (title + date), ordered most recent first, with upcoming meetings on top. Picking one links the action to that meeting.

Edit Action page gets the same controls so a creator can later attach/detach a meeting or move an action between meetings.

## Email + ICS behavior

`send-action-notification` edge function:

- If action has no `meeting_id`: send the current email with Accept/Reject buttons, no ICS attachment. (This removes the current broken auto-meeting.)
- If action has a `meeting_id`: load the meeting, build ICS with:
  - `UID` = `meeting-<meeting.id>@actionpoint` (stable, so re-sends and shared-meeting actions land on the same calendar event)
  - `SUMMARY` = meeting title (falls back to action's meeting title)
  - `DTSTART` / `DTEND` from meeting fields, formatted with timezone
  - `LOCATION` and `DESCRIPTION` from meeting fields, plus a list of all linked action descriptions
  - `ATTENDEE` lines collected from every action linked to the meeting (owner + CC + BCC), de-duplicated
  - `ORGANIZER` = the meeting creator's email
- Same ICS attached to every email sent for any action in the meeting; calendar clients merge by UID.

Accept/Reject tokens remain per-action so each owner responds for their own task.

## Data model

New table `public.meetings`:

- `title` (text, required)
- `description` (text, nullable) — meeting agenda / notes
- `location` (text, nullable)
- `start_at` (timestamptz)
- `end_at` (timestamptz)
- `timezone` (text, e.g. `Africa/Nairobi`)
- `organization_id` (uuid, FK to organizations)
- `created_by` (uuid, references auth.users)
- `ics_uid` (text, stable identifier used in ICS)

Add `meeting_id uuid NULL` (FK to `meetings`, ON DELETE SET NULL) on `public.actions`. Existing rows stay `NULL` → treated as task-only by the new email flow, preserving their original behavior since we are leaving them as-is.

RLS:

- Members of an organization can read meetings in their org.
- Members can insert meetings into their org (`created_by = auth.uid()` and `organization_id` matches their membership).
- Only the creator or an org admin can update/delete a meeting.
- Standard `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role` (no anon).

## Frontend changes

- `src/types/action.ts` — add `meetingId?: string` to `ActionItem`, add `Meeting` interface.
- `src/lib/mappers.ts` — map `meeting_id` ↔ `meetingId`.
- `src/components/ActionForm.tsx` — three-way RadioGroup, conditional meeting fields, new "pick existing meeting" combobox.
- `src/lib/actions/createAction.ts` / `updateAction.ts` — when mode is "new meeting", insert into `meetings` first then store `meeting_id`; when "existing", just set `meeting_id`; when "task only", clear `meeting_id`.
- New `src/hooks/useMeetings.ts` — fetch + cache org meetings for the picker.
- New small `MeetingFieldsSection` subcomponent to keep the form readable.

## Edge function changes

- `supabase/functions/send-action-notification/index.ts`
  - Drop the unconditional ICS generation.
  - If `action.meeting_id`: fetch meeting + all sibling actions sharing that meeting, build ICS with deduped attendees, attach.
  - If not: send task-only email (still includes Accept/Reject for owner).

## Out of scope (for this iteration)

- Dedicated "Meetings" page to view/manage meetings.
- Meeting reminders, reschedules, or cancellations via ICS METHOD=CANCEL.
- Notifying previously-invited attendees when a meeting's time changes.
