
## Goal

Add a public, professional `/docs` documentation page that explains what ActionsPoint (the SaaS) is, how it works, and how to use its main features. Navigation between topics uses a **left sidebar** (not a top nav).

## Scope

- Public route, no auth required (like `/privacy` and `/terms`).
- Static, hand-written content (no DB, no Super Admin editing for now — the previous Legal Documents pattern can be reused later if the user wants editable docs).
- Linked from the app footer alongside Privacy / Terms, and from the Landing page.

## Route & Files

- New route `/docs` (and `/docs/:section` for deep links) in `src/App.tsx`, public.
- New page `src/pages/Docs.tsx` — layout shell with sidebar + content area.
- New folder `src/components/docs/`:
  - `DocsSidebar.tsx` — sticky left sidebar listing topics, active-state highlighting, mobile collapsible (Sheet on small screens).
  - `DocsLayout.tsx` — 2-column layout (sidebar + article), header with logo/back-to-app link, footer reused.
  - `sections/` — one component per topic so content stays maintainable:
    - `Introduction.tsx` — what ActionsPoint is, who it's for.
    - `GettingStarted.tsx` — sign up, create organization, invite members.
    - `Organizations.tsx` — multi-tenant model, roles (member / org admin / super admin).
    - `Actions.tsx` — creating actions, priorities, deadlines, statuses (Not Started → 25/50/75% → Completed, Continuous).
    - `MyActionsAndDrafts.tsx` — personal views and drafts.
    - `Projects.tsx` — projects + Gantt view.
    - `Dashboard.tsx` — charts, upcoming deadlines, notes stats.
    - `Notifications.tsx` — email notifications, toast toggle, due-date reminders.
    - `ComplianceReport.tsx` — monthly compliance report.
    - `Security.tsx` — RLS, org isolation, best practices.
    - `Faq.tsx` — common questions.
- Section registry (`src/components/docs/sections/index.ts`) exporting an ordered array `{ id, title, component }` — drives both sidebar and routing.

## Navigation Behavior

- Sidebar shows the ordered topic list, grouped under headings: **Overview**, **Core features**, **Admin**, **Help**.
- Clicking an item updates the URL to `/docs/<section-id>` and scrolls the article into view (single-page with anchor-style sections, using `useLocation` + `scrollIntoView`).
- Active section highlighted via `NavLink` + `IntersectionObserver` for scroll-spy.
- On mobile (<768px): sidebar becomes a `Sheet` triggered by a "Topics" button in the docs header.
- Sidebar is independent from the app's `AppSidebar` — this page uses its own minimal layout so it works for logged-out visitors too.

## Content Tone

Professional, concise, product-marketing-meets-user-guide. Each section: short intro paragraph, bullet points for capabilities, a "Tips" callout where useful. No lorem ipsum. Uses semantic tokens only (no hardcoded colors).

## Footer & Landing Links

- `src/components/layout/AppLayout.tsx` footer: add `<Link to="/docs">Documentation</Link>` next to Privacy / Terms.
- `src/pages/Landing.tsx`: add a "Docs" link in the header nav and a CTA in the footer area.

## Out of Scope (for now)

- No Super Admin editing UI or DB-backed content for docs. If the user later wants that, we'd mirror the `legal_documents` table pattern.
- No search-in-docs, no versioning.

## Technical Notes

- Uses existing shadcn primitives: `ScrollArea`, `Sheet`, `Separator`, `Button`, `Card`.
- Typography via Tailwind `prose` (already available through project styles) or custom classes using semantic tokens; no `text-white` / `bg-black` literals.
- Route added as **public** in `src/App.tsx` (same tier as `/privacy`, `/terms`).
- Section IDs are stable slugs to keep deep links working.
