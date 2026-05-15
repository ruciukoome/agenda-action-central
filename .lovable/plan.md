## Goal

Let you capture multiple action items in a single meeting, group/filter them by meeting title, and pause any in-progress entry as a private draft so you can come back to it after handling a more urgent one.

## What changes for you

1. **Meeting Title field** on the Add/Edit Action form (required, with autocomplete from your recent meeting titles).
2. **Drafts**: a new "Save as draft" button next to the existing Create button. Drafts are private to you (no emails sent, no notifications) until you finalize them.
3. **Drafts panel** accessible from the Add Action page header and from the sidebar ("My Drafts" with a count badge). Lets you switch between drafts mid-meeting, resume any draft, or delete it.
4. **Grouping by meeting** on My Actions / Managed Actions: a new "Meeting" column and a "Group by meeting" toggle. Filter by meeting title in the existing filter bar.
5. **Submit a draft** = same as today's create flow: inserts into `actions`, sends owner email, removes the draft.

UI stays consistent with the existing AppLayout, sidebar, table, and form styling — same shadcn components and tokens.

## Technical section

### Database (one migration)
- `actions.meeting_title text` — nullable initially for back-compat; new entries require it from the form.
- New table `action_drafts`:
  - same shape as `actions` (description, department, meeting_date, meeting_title, priority, owner_email, progress_status, notes, due_date, cc_emails text[], bcc_emails text[])
  - `user_id uuid not null`, `organization_id uuid`, timestamps
  - all fields nullable except `user_id` so partial drafts save fine
- RLS on `action_drafts`: user can SELECT/INSERT/UPDATE/DELETE only where `user_id = auth.uid()` (private to me, as chosen).
- Index `actions(meeting_title)` and `action_drafts(user_id, updated_at desc)`.

### Frontend
- `ActionForm.tsx`: add `meetingTitle` field (Combobox with recent titles fetched via a small `useRecentMeetingTitles` hook). Add second submit button "Save as draft" wired to a new `onSaveDraft` prop.
- New `src/lib/drafts/` module: `createDraft`, `updateDraft`, `listDrafts`, `deleteDraft`, `promoteDraftToAction` (calls existing `createAction` then deletes draft).
- `AddAction.tsx`: load `?draftId=` from URL to resume; show a Drafts sheet/sidebar pinned to the page header.
- New page `src/pages/Drafts.tsx` + sidebar entry "My Drafts" with unread-style count badge.
- `ActionsTable.tsx` + filters: add "Meeting" column and meeting filter dropdown; optional group-by-meeting view.

### Out of scope (can be follow-ups)
- A full Meetings entity / Meetings page (you chose lightweight).
- Sharing drafts across the org.
- Bulk submit at end of meeting.
