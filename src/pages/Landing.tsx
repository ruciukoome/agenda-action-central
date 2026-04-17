import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useOrganization } from '@/contexts/OrganizationContext';
import heroDashboard from '@/assets/hero-dashboard.jpg';
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
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, isSuperAdmin } = useOrganization();

  const ctaTarget = !user
    ? '/auth'
    : isSuperAdmin
      ? '/super-admin'
      : organization
        ? '/action-items'
        : '/onboarding';

  const ctaLabel = !user ? 'Get Started Free' : 'Open Dashboard';

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">ActionPoint</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">Roles</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate(ctaTarget)} size="sm">
                {ctaLabel}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign in</Button>
                <Button size="sm" onClick={() => navigate('/auth')}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'var(--gradient-hero)' }}
          aria-hidden
        />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/50 backdrop-blur text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Multi-tenant action tracking, built for teams
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Turn meeting decisions into{' '}
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                accountable action
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              ActionPoint helps organizations capture, assign, and follow up on action items —
              so nothing slips through the cracks. Every team, every department, in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => navigate(ctaTarget)} className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See features</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Free to start · No credit card required · Set up in minutes
            </p>
          </div>

          {/* Hero visual */}
          <div className="mt-14 md:mt-20 max-w-6xl mx-auto relative">
            <div
              className="absolute -inset-4 md:-inset-8 rounded-3xl opacity-40 blur-3xl pointer-events-none"
              style={{ background: 'var(--gradient-hero)' }}
              aria-hidden
            />
            <div
              className="relative rounded-2xl overflow-hidden border bg-background"
              style={{ boxShadow: 'var(--shadow-glow)' }}
            >
              <img
                src={heroDashboard}
                alt="ActionPoint dashboard showing action items grouped by progress status with assigned team members"
                width={1920}
                height={1080}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to follow through</h2>
            <p className="text-muted-foreground text-lg">
              Built for organizations that take action items seriously.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Capture from meetings"
              desc="Record action items with owners, departments, due dates, and priority — straight from your meeting notes."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Assign to your team"
              desc="Org admins assign work to specific members. Each person sees what's on their plate."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Real-time progress"
              desc="Track Not Started → 25% → 50% → 75% → Complete. Dashboards show the health of every initiative."
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Email reminders"
              desc="Automatic notifications keep owners on track and stakeholders informed of progress."
            />
            <FeatureCard
              icon={<Building2 className="h-5 w-5" />}
              title="Multi-organization"
              desc="Each organization is isolated with its own members, actions, and reports. Perfect for agencies and groups."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Secure by design"
              desc="Row-level security ensures teams only see their own data. Roles control who can do what."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="text-muted-foreground text-lg">Three steps to get your team moving.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <StepCard
              n="1"
              title="Create your organization"
              desc="Sign up and spin up your workspace. You become the org admin automatically."
            />
            <StepCard
              n="2"
              title="Invite your team"
              desc="Add members by email and assign them admin or member roles."
            />
            <StepCard
              n="3"
              title="Track every action"
              desc="Log items from meetings, assign owners, watch progress update in real time."
            />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Built for every role</h2>
            <p className="text-muted-foreground text-lg">From staff on the ground to platform owners.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <RoleCard
              icon={<Users className="h-5 w-5" />}
              role="Org Member"
              desc="Update progress on actions assigned to you. Add notes, mark complete, stay accountable."
              perks={['View assigned actions', 'Update progress', 'Add notes & comments']}
            />
            <RoleCard
              icon={<Building2 className="h-5 w-5" />}
              role="Org Admin"
              desc="Run your organization. Invite members, assign work, see everything happening across departments."
              perks={['Invite & manage members', 'Assign actions', 'Generate reports']}
              highlighted
            />
            <RoleCard
              icon={<Shield className="h-5 w-5" />}
              role="Super Admin"
              desc="Platform owner. Manage all organizations, subscriptions, and view platform-wide statistics."
              perks={['View all orgs', 'Manage subscriptions', 'Platform analytics']}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-2xl p-10 md:p-16 text-center relative overflow-hidden"
            style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-glow)' }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to stop dropping the ball?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Join organizations using ActionPoint to keep their commitments visible and accountable.
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
            <span>ActionPoint © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link>
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
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
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
    <Card
      className={
        highlighted
          ? 'border-primary shadow-[var(--shadow-card)] relative'
          : 'border-border/50'
      }
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Most common
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
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
