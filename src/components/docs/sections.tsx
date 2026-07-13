import { ReactNode } from "react";
import {
  BookOpen,
  Rocket,
  Building2,
  ListChecks,
  ClipboardList,
  GitBranch,
  LayoutDashboard,
  Bell,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export type DocsSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  group: "Overview" | "Core features" | "Admin" | "Help";
  content: ReactNode;
};

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 rounded-lg border-l-2 border-brand bg-brand/5 px-4 py-3 text-sm">
      <span className="font-semibold text-brand">Tip · </span>
      <span className="text-foreground/90">{children}</span>
    </div>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-foreground/80">{children}</p>;
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-foreground">{children}</h3>
  );
}

function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="my-3 ml-5 list-disc space-y-2 text-foreground/80 marker:text-muted-foreground">
      {children}
    </ul>
  );
}

export const docsSections: DocsSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    icon: BookOpen,
    group: "Overview",
    content: (
      <>
        <P>
          <strong>ActionsPoint</strong> is a multi-tenant SaaS for tracking action items and follow-ups
          from meetings, audits, and reviews. It turns unresolved decisions into accountable, time-bound
          tasks — with owners, deadlines, progress, and evidence in one place.
        </P>
        <H2>What it solves</H2>
        <UL>
          <li>Action items lost in minutes, emails, and spreadsheets</li>
          <li>No visibility into who owns what, and by when</li>
          <li>Manual follow-up on progress and overdue items</li>
          <li>Compliance reporting done from scratch every month</li>
        </UL>
        <H2>Who it's for</H2>
        <P>
          Operations, compliance, quality, project, and leadership teams that run recurring meetings and
          need reliable follow-through. Suitable for organizations of any size — data is isolated per
          organization with role-based access.
        </P>
      </>
    ),
  },
  {
    id: "getting-started",
    title: "Getting started",
    icon: Rocket,
    group: "Overview",
    content: (
      <>
        <P>Three steps take you from sign-up to your first tracked action.</P>
        <H2>1. Create your account</H2>
        <P>Go to <em>Sign in</em>, register with email and password, then confirm your address if prompted.</P>
        <H2>2. Set up your organization</H2>
        <P>
          On first login, onboarding asks for your organization name. This container isolates your data
          from every other tenant and becomes the boundary for members, actions, and reports.
        </P>
        <H2>3. Invite your team &amp; add your first action</H2>
        <P>
          From <em>Organization</em>, invite members by email. Then head to <em>Add Action</em>, assign
          an owner, priority, and deadline, and you're tracking.
        </P>
        <Tip>Start small — one meeting, one owner, one deadline. Habits scale faster than features.</Tip>
      </>
    ),
  },
  {
    id: "organizations",
    title: "Organizations & roles",
    icon: Building2,
    group: "Core features",
    content: (
      <>
        <P>
          Every user belongs to one or more organizations. Actions, projects, and reports are always
          scoped to the currently selected organization.
        </P>
        <H2>Roles</H2>
        <UL>
          <li><strong>Member</strong> — creates and updates their own actions, sees the organization's shared views.</li>
          <li><strong>Organization Admin</strong> — manages members, invitations, org settings, and compliance reports.</li>
          <li><strong>Super Admin</strong> — platform-level operator: tenants, users, roles, and system settings.</li>
        </UL>
        <Tip>Switch organizations any time from the org switcher in the top header.</Tip>
      </>
    ),
  },
  {
    id: "actions",
    title: "Actions",
    icon: ListChecks,
    group: "Core features",
    content: (
      <>
        <P>Actions are the atomic unit of ActionsPoint — a task with an owner, a deadline, and a lifecycle.</P>
        <H2>Anatomy of an action</H2>
        <UL>
          <li><strong>Title &amp; description</strong> — what needs to happen, and why</li>
          <li><strong>Owner</strong> — the responsible person (assignable to any org member)</li>
          <li><strong>Priority</strong> — Low, Medium, High, Critical</li>
          <li><strong>Deadline</strong> — target completion date</li>
          <li><strong>Source</strong> — meeting title or reference for traceability</li>
          <li><strong>Attachments &amp; notes</strong> — supporting context and progress updates</li>
        </UL>
        <H2>Progress statuses</H2>
        <UL>
          <li>Not Started · 25% · 50% · 75% · Completed</li>
          <li><strong>Continuous</strong> — for standing items that never close (shown in blue)</li>
        </UL>
        <Tip>Use <em>Quick Status Update</em> from any card to advance progress in one click.</Tip>
      </>
    ),
  },
  {
    id: "my-actions",
    title: "My Actions & Drafts",
    icon: ClipboardList,
    group: "Core features",
    content: (
      <>
        <H2>My Actions</H2>
        <P>A focused view of actions assigned to you across the organization. Filter by status, priority, or deadline window.</P>
        <H2>Drafts</H2>
        <P>
          Not ready to publish an action? Save it as a draft. Drafts stay private to you until you
          promote them, so you can capture ideas during a meeting without cluttering the org's view.
        </P>
      </>
    ),
  },
  {
    id: "projects",
    title: "Projects",
    icon: GitBranch,
    group: "Core features",
    content: (
      <>
        <P>
          Group related actions into <strong>Projects</strong> for cross-cutting initiatives that span
          several meetings or teams.
        </P>
        <UL>
          <li>Add existing actions to a project or create new ones from within it</li>
          <li>See project-level progress rolled up from its actions</li>
          <li>Visualize timelines on the built-in <strong>Gantt view</strong></li>
        </UL>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    group: "Core features",
    content: (
      <>
        <P>The Dashboard is your organization's operating picture at a glance.</P>
        <UL>
          <li>Actions by status, priority, and owner</li>
          <li>Upcoming deadlines and overdue items</li>
          <li>Notes and meeting-source statistics</li>
          <li>Trend charts to spot bottlenecks early</li>
        </UL>
      </>
    ),
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    group: "Core features",
    content: (
      <>
        <H2>Email</H2>
        <P>
          Assignees receive an email when an action is created, updated, or handed off between stages.
          Due-date reminders are sent automatically before the deadline.
        </P>
        <H2>In-app toasts</H2>
        <P>
          Confirmation toasts appear on save, delete, and update. You can silence them globally under{" "}
          <em>Settings → Notifications</em> — useful for demo sessions and screen recordings.
        </P>
      </>
    ),
  },
  {
    id: "compliance",
    title: "Compliance Report",
    icon: BarChart3,
    group: "Admin",
    content: (
      <>
        <P>
          Organization Admins can generate and export a monthly <strong>Compliance Report</strong> showing
          completion rates, overdue counts, and owner-level performance. Reports can also be scheduled to
          arrive by email at the start of each month.
        </P>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    icon: ShieldCheck,
    group: "Admin",
    content: (
      <>
        <UL>
          <li><strong>Tenant isolation</strong> — every row is scoped by <code>organization_id</code> and enforced by Row-Level Security in Postgres.</li>
          <li><strong>Role separation</strong> — roles are stored in a dedicated table and checked server-side.</li>
          <li><strong>Least-privilege APIs</strong> — edge functions require signed calls and shared secrets where relevant.</li>
          <li><strong>Session hygiene</strong> — automatic idle sign-out protects unattended sessions.</li>
        </UL>
      </>
    ),
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    group: "Help",
    content: (
      <>
        <H2>Can I belong to more than one organization?</H2>
        <P>Yes. Use the org switcher in the header to move between them; data never crosses boundaries.</P>
        <H2>What happens to actions when a member leaves?</H2>
        <P>Their actions remain in the organization. An Org Admin can reassign them to another owner.</P>
        <H2>Do you support external respondents?</H2>
        <P>Yes — an action can be shared via a secure respond link so non-users can post updates without a full account.</P>
        <H2>Where is my data stored?</H2>
        <P>In a managed Postgres database with encryption at rest and in transit, isolated per organization.</P>
      </>
    ),
  },
];

export const docsGroups: DocsSection["group"][] = ["Overview", "Core features", "Admin", "Help"];
