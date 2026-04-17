The screenshot shows a **Kanban-style board** with columns by progress status (Not Started, 25%, 50%, 75%, Complete), plus stat cards across the top and a large search bar. This is in addition to having the sidebar on the left side. I'll redesign the Action Items area to match while keeping all existing data, filters, navigation, and edit flows working.

### Layout to Build

```text
┌─────────────────────────────────────────────────────────────┐
│  Action Items          [ 🔍  Search actions...        ]      │
├─────────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│ │Total   │ │In Prog │ │Complete│ │ Due    │   (stat cards)  │
│ │  58    │ │  25%   │ │  32%   │ │ Soon 4 │                 │
│ └────────┘ └────────┘ └────────┘ └────────┘                 │
├─────────────────────────────────────────────────────────────┤
│ Not Started │  25%   │  50%   │  75%   │ Complete           │
│ ┌────────┐  │┌──────┐│┌──────┐│┌──────┐│┌──────┐            │
│ │ card   │  ││ card │││ card │││ card │││ card │            │
│ │ 👤dept │  ││ 👤   │││ 👤   │││ 👤   │││ 👤   │            │
│ │ Due... │  ││Due...│││Due...│││Due...│││Due...│            │
│ └────────┘  │└──────┘│└──────┘│└──────┘│└──────┘            │
│ ┌────────┐  │┌──────┐│                                      │
│ │ card   │  ││ card ││  (scrollable columns)                │
│ └────────┘  │└──────┘│                                      │
└─────────────────────────────────────────────────────────────┘
```

### Changes

**1. Replace `ActionDashboard.tsx` grid with a Kanban board**

- Top row: prominent search input (gradient/glassmorphism styling like screenshot).
- Stats strip: 4 cards — Total, In Progress %, Completed %, Due Soon count — using brand gradient + `--shadow-glow`.
- Board: 5 columns grouped by `progressStatus` ("Not Started", "25%", "50%", "75%", "100%/Complete"). Each column has a colored pill header with count badge, matching the soft pastels in the screenshot (blue, indigo, teal/green, pink/purple).
- Keep existing `ActionFilters` (priority/department/completion) collapsed below the search as a "More filters" toggle, so functionality stays.
- "New Action" button preserved in header row.

**2. Create `ActionKanbanCard.tsx` (compact variant)**

- Replaces `ActionCard` only inside the board. White rounded card with subtle shadow.
- Shows: avatar circle (initial of ownerEmail), department name (bold), Due date (small grey), small priority pill in the corner.
- Click → same `onEdit(action)` → navigates to `/edit/:id` (unchanged).
- Keep original `ActionCard.tsx` untouched in case it's used elsewhere.

**3. Tweak `Index.tsx**`

- Remove the 7-col grid (5 + 2 with EmailIntegrationCard). Move `EmailIntegrationCard` below the board, full-width or tucked into a collapsible side panel, so the board gets full horizontal space (essential for 5 columns at 1100px viewport).
- Keep `View Dashboard` button, org name, header.

**4. Styling**

- Use existing tokens: `--gradient-hero`, `--shadow-glow`, `--shadow-card` and Tailwind `bg-gradient-to-br`.
- Column header colors: `bg-blue-100/60`, `bg-indigo-100/60`, `bg-violet-100/60`, `bg-teal-100/60`, `bg-pink-100/60` with matching dark text — pastel feel from screenshot.
- Backdrop blur + soft purple ambient glow behind the board on `/app`.

### Functionality Preserved

- All filters (search, priority, department, progress, completion) still apply — search moves to top bar; rest in collapsible panel.
- Edit click still calls `onEditAction` → `/edit/:id`.
- Loading skeletons → column-shaped skeletons.
- Empty state per column ("No items") + global empty state if zero results.
- Polling, auth, org scoping unchanged.
- `ActionStatusBadge`, `ActionItem` type, fetch/update logic — untouched.

### Files

- **Edit** `src/components/ActionDashboard.tsx` — full rewrite to Kanban layout.
- **Create** `src/components/ActionKanbanCard.tsx` — compact card.
- **Edit** `src/pages/Index.tsx` — drop side column, give board full width, move EmailIntegrationCard below.

### Responsive

- ≥1024px: 5 columns side-by-side.
- 768–1023px: horizontal scroll for columns (preserves Kanban feel).
- <768px: stacked single column with column header dividers.