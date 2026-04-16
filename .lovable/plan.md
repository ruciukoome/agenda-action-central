

## Multi-Tenant SaaS Architecture Plan for Action Point

### Current State
- Single-tenant: each user sees only their own actions (`user_id = auth.uid()`)
- No concept of organizations, roles, or shared visibility
- Tables: `actions`, `profiles`, `action_tokens`

### Target Architecture

```text
┌─────────────────────────────────────────────────┐
│                  YOU (Super Admin)               │
│         Manages billing, subscriptions           │
│         Sees all organizations                   │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
  ┌──────────┐   ┌──────────┐      ┌──────────┐
  │  Org A   │   │  Org B   │      │  Org C   │
  │ (Admin)  │   │ (Admin)  │      │ (Admin)  │
  └────┬─────┘   └────┬─────┘      └────┬─────┘
       │               │                 │
  ┌────┴────┐    ┌─────┴────┐      ┌────┴────┐
  │ Members │    │ Members  │      │ Members │
  │ Staff A │    │ Staff B  │      │ Staff C │
  └─────────┘    └──────────┘      └─────────┘
```

### New Database Tables

**1. `organizations`** — Each company/org using the platform
- `id`, `name`, `slug` (unique URL-friendly identifier), `logo_url`, `created_at`, `created_by` (the user who created it)

**2. `organization_members`** — Links users to orgs with roles
- `id`, `organization_id`, `user_id`, `role` (enum: `admin`, `member`), `created_at`
- Unique constraint on `(organization_id, user_id)`

**3. `subscriptions`** (for your SaaS billing)
- `id`, `organization_id`, `plan` (enum: `free`, `basic`, `premium`), `status` (enum: `active`, `expired`, `cancelled`), `started_at`, `expires_at`

**4. `app_role` enum** — `super_admin`, stored in a `user_roles` table for you (the platform owner)

### Changes to Existing Tables

**`actions` table** — Add `organization_id` column (UUID, FK to organizations)
- RLS changes: users can see/edit actions belonging to their organization (not just their own)
- Admins can see all org actions; members see actions assigned to them OR created by them

**`profiles` table** — No structural changes, but queries will be org-scoped

### Role-Based Access

| Role | Can Do |
|------|--------|
| **Super Admin (you)** | View all orgs, manage subscriptions, platform settings |
| **Org Admin** | Invite/remove members, assign actions to any member, view all org actions, generate reports, customize org settings |
| **Org Member** | View actions assigned to them, update progress/notes on their actions, create new actions |

### RLS Policy Changes

- **actions**: `SELECT/UPDATE` where `organization_id` matches user's org membership
- **organization_members**: users can read members of their own org
- **organizations**: users can read orgs they belong to; admins can update their org
- Security definer function `get_user_org_id()` to avoid recursive RLS

### Key App Changes

1. **Onboarding flow** — After signup: create org OR join via invite
2. **Org context provider** — Store active `organization_id` in React context; all queries filter by it
3. **Admin dashboard** — Org admins see all org actions, can assign to members, generate reports (export CSV/Excel)
4. **Member view** — Staff see "My Actions" (assigned to them) with ability to update progress
5. **Action assignment** — When creating an action, select a member from the org as the owner
6. **Super admin panel** — A separate view for you to manage orgs and subscriptions
7. **Invite system** — Org admins invite users by email; creates a pending membership

### Implementation Order

1. Database migration: new tables, enums, RLS policies, add `organization_id` to actions
2. Org creation + onboarding flow
3. Org context provider + update all queries to be org-scoped
4. Member management (invite, remove, role assignment)
5. Action assignment to org members
6. Admin reporting/export features
7. Super admin panel + subscription management
8. Payment integration (Paddle or Stripe) for org billing

This is a significant architectural evolution. Shall I proceed with implementation starting from the database migration?

