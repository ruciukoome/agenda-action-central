import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  Building2,
  Bell,
  Sparkles,
  Target,
  ClipboardList,
  AlertTriangle,
  Calendar,
  FolderKanban,
  FileSpreadsheet,
  Mail,
  Layers,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Landmark,
  Factory,
  Globe2,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, isSuperAdmin, isLoading: orgLoading } = useOrganization();

  useEffect(() => {
    if (!user || orgLoading) return;
    if (isSuperAdmin) navigate("/super-admin", { replace: true });
    else if (organization) navigate("/app", { replace: true });
  }, [user, orgLoading, organization, isSuperAdmin, navigate]);

  const ctaTarget = !user ? "/auth" : isSuperAdmin ? "/super-admin" : organization ? "/app" : "/onboarding";
  const ctaLabel = !user ? "Get Started Free" : "Open Dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">ActionsPoint</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
              Why
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#who" className="text-muted-foreground hover:text-foreground transition-colors">
              Who it's for
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">
              Roles
            </a>
            <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate(ctaTarget)} size="sm">
                {ctaLabel}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Sign in
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/50 backdrop-blur text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              The accountability layer for modern organizations
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Every decision, every owner, every deadline -{" "}
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                tracked to completion
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              ActionsPoint turns meeting decisions, board resolutions, audit findings and project tasks into trackable
              action items with clear owners, due dates and progress — so commitments stop falling through the cracks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => navigate(ctaTarget)} className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See what's inside</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Free to start · No credit card required · Embeds into your existing portal
            </p>
          </div>

          <div className="mt-14 md:mt-20 max-w-6xl mx-auto relative">
            <div
              className="absolute -inset-4 md:-inset-8 rounded-3xl opacity-40 blur-3xl pointer-events-none"
              style={{ background: "var(--gradient-hero)" }}
              aria-hidden
            />
            <div
              className="relative rounded-2xl overflow-hidden border bg-background"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              <img
                src={heroDashboard}
                alt="ActionsPoint dashboard showing action items grouped by progress status with assigned team members"
                width={1920}
                height={1080}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background text-xs font-medium text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              The problem
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Meetings end. Accountability disappears.</h2>
            <p className="text-muted-foreground text-lg">
              Decisions get buried in minutes documents, email threads, and spreadsheets. By the next meeting, no one
              remembers what was promised, who owns it, or how far along it is.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ProblemCard
              title="Lost in minutes"
              desc="Action items live in Word docs and PDFs no one re-opens until the next meeting."
            />
            <ProblemCard
              title="No clear owner"
              desc={`"Someone should follow up" becomes nobody's job. Deadlines slip silently.`}
            />
            <ProblemCard
              title="No visibility"
              desc="Leaders can't answer 'what's the status?' without chasing people on email and WhatsApp."
            />
          </div>
        </div>
      </section>

      {/* Solution / Features */}
      <section id="features" className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">One system for every commitment</h2>
            <p className="text-muted-foreground text-lg">
              Capture, assign, track and report — across departments, meetings and projects.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Capture from any meeting"
              desc="Log action items with owner, department, due date, priority and source meeting — in seconds."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Assign with clarity"
              desc="Every item has one accountable owner and optional collaborators. No more diffused responsibility."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Live progress dashboards"
              desc="Not Started → 25% → 50% → 75% → Complete. See the health of every initiative at a glance."
            />
            <FeatureCard
              icon={<FolderKanban className="h-5 w-5" />}
              title="Projects & Gantt view"
              desc="Group related actions into projects with timelines, dependencies and durations."
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5" />}
              title="Deadlines & reminders"
              desc="Automatic email nudges to owners before due dates and escalations when items slip."
            />
            <FeatureCard
              icon={<FileSpreadsheet className="h-5 w-5" />}
              title="Compliance reports"
              desc="One-click monthly reports showing what was committed, completed, overdue and outstanding."
            />
            <FeatureCard
              icon={<Mail className="h-5 w-5" />}
              title="Email updates from owners"
              desc="Owners update progress straight from email — no login required for quick status changes."
            />
            <FeatureCard
              icon={<Building2 className="h-5 w-5" />}
              title="Multi-organization"
              desc="Each organization is fully isolated. Perfect for groups, agencies and parent companies."
            />
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              title="Embed in your platform"
              desc="Drop ActionsPoint into your existing client portal so users never have to leave to track work."
            />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Built for organizations that have to follow through</h2>
            <p className="text-muted-foreground text-lg">
              Wherever decisions, audits or board resolutions need to turn into delivered outcomes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <MarketCard
              icon={<Landmark className="h-5 w-5" />}
              market="Government & Public Sector"
              desc="Track cabinet decisions, parliamentary resolutions, donor commitments and inter-ministerial action points."
            />
            <MarketCard
              icon={<Briefcase className="h-5 w-5" />}
              market="NGOs & Development"
              desc="Manage board resolutions, project deliverables, donor reporting and field-team action items."
            />
            <MarketCard
              icon={<HeartPulse className="h-5 w-5" />}
              market="Healthcare"
              desc="Close out clinical audit findings, accreditation gaps and quality-improvement actions across departments."
            />
            <MarketCard
              icon={<GraduationCap className="h-5 w-5" />}
              market="Education & Universities"
              desc="Senate, council and committee resolutions tracked from minute to completion across faculties."
            />
            <MarketCard
              icon={<Factory className="h-5 w-5" />}
              market="Enterprise Operations"
              desc="Cross-functional initiatives, internal audit responses, EHS findings and management-review actions."
            />
            <MarketCard
              icon={<Globe2 className="h-5 w-5" />}
              market="Professional Services"
              desc="Client commitments, engagement action logs and partner-meeting follow-ups across teams."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="text-muted-foreground text-lg">Live in your workflow within a day.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <StepCard
              n="1"
              title="Create your workspace"
              desc="Sign up and spin up your organization. You become the admin automatically."
            />
            <StepCard
              n="2"
              title="Invite your team"
              desc="Add members by email and group them by department. Assign admin or member roles."
            />
            <StepCard
              n="3"
              title="Log actions & projects"
              desc="Capture decisions from meetings or import a backlog. Assign owners and due dates."
            />
            <StepCard
              n="4"
              title="Track to completion"
              desc="Owners update progress, dashboards refresh live, reminders chase the rest."
            />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">A place for every role</h2>
            <p className="text-muted-foreground text-lg">From staff on the ground to platform owners.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <RoleCard
              icon={<Users className="h-5 w-5" />}
              role="Org Member"
              desc="Update progress on actions assigned to you. Add notes, mark complete, stay accountable."
              perks={["View assigned actions", "Update progress", "Add notes & comments"]}
            />
            <RoleCard
              icon={<Building2 className="h-5 w-5" />}
              role="Org Admin"
              desc="Run your organization. Invite members, assign work, see everything across departments."
              perks={["Invite & manage members", "Assign & reassign actions", "Generate compliance reports"]}
              highlighted
            />
            <RoleCard
              icon={<Shield className="h-5 w-5" />}
              role="Super Admin"
              desc="Platform owner. Manage all organizations, subscriptions and platform-wide statistics."
              perks={["View all organizations", "Manage subscriptions", "Platform analytics"]}
            />
          </div>
        </div>
      </section>

      {/* Why ActionsPoint */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Why teams pick ActionsPoint</h2>
              <p className="text-muted-foreground text-lg">
                Generic project tools weren't built for resolutions, audit findings or board commitments. ActionsPoint
                is.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Purpose-built for action tracking — not retrofitted task software",
                  "Multi-tenant and secure by default with row-level isolation",
                  "Email-first updates so owners don't need to learn a new tool",
                  "Embeds inside your existing client or staff portal",
                  "Affordable per-organization pricing — scales from 5 to 5,000 users",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-border/50">
              <CardContent className="p-8 space-y-6">
                <Stat n="100%" label="Visibility into every committed action" />
                <Stat n="~5 min" label="Average time to log a meeting's action items" />
                <Stat n="0" label="Decisions lost between meetings" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-2xl p-10 md:p-16 text-center relative overflow-hidden"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to stop dropping the ball?</h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Join organizations using ActionsPoint to keep their commitments visible, owned and delivered.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate(ctaTarget)} className="gap-2">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span>ActionsPoint © {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#who" className="hover:text-foreground transition-colors">
              Who it's for
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-border/50 hover:border-border transition-colors hover:shadow-[var(--shadow-card)]">
      <CardContent className="p-6 space-y-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="border-border/50 bg-background">
      <CardContent className="p-6 space-y-2">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function MarketCard({ icon, market, desc }: { icon: React.ReactNode; market: string; desc: string }) {
  return (
    <Card className="border-border/50 bg-background">
      <CardContent className="p-6 space-y-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <h3 className="font-semibold">{market}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6 space-y-3">
        <div className="h-10 w-10 rounded-full bg-[image:var(--gradient-hero)] text-white flex items-center justify-center font-bold">
          {n}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">{n}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function RoleCard({
  icon,
  role,
  desc,
  perks,
  highlighted,
}: {
  icon: React.ReactNode;
  role: string;
  desc: string;
  perks: string[];
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? "border-primary shadow-[var(--shadow-card)] relative" : "border-border/50"}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Most common
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg">{role}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mt-1">{desc}</p>
        </div>
        <ul className="space-y-2 pt-2">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
