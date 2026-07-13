import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DocsSidebar, useActiveSection } from "@/components/docs/DocsSidebar";
import { docsSections } from "@/components/docs/sections";

export default function Docs() {
  const { active: activeId, scrollToSection } = useActiveSection();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open topics">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <SheetTitle className="mb-4 text-base">Topics</SheetTitle>
                <DocsSidebar activeId={activeId} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">ActionsPoint</span>
              <span className="ml-1 hidden text-sm text-muted-foreground sm:inline">/ Documentation</span>
            </Link>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to site
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-8 lg:py-12">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <DocsSidebar activeId={activeId} />
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 flex-1 max-w-3xl">
            <header className="mb-10 border-b pb-8">
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
                ActionsPoint Documentation
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to run accountable follow-through
              </h1>
              <p className="mt-3 text-muted-foreground">
                Learn how ActionsPoint helps teams turn meeting decisions into tracked, owned, and
                reported action items — from first sign-up to organization-wide compliance.
              </p>
            </header>

            <div className="space-y-14">
              {docsSections.map((s) => {
                const Icon = s.icon;
                return (
                  <section
                    key={s.id}
                    id={`section-${s.id}`}
                    className="scroll-mt-24"
                    aria-labelledby={`heading-${s.id}`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 id={`heading-${s.id}`} className="text-2xl font-semibold tracking-tight">
                        {s.title}
                      </h2>
                    </div>
                    <div className="space-y-3 text-[15px]">{s.content}</div>
                  </section>
                );
              })}
            </div>

            <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
              Need more help? Reach out to your organization admin, or contact support from your
              account settings.
            </footer>
          </article>
        </div>
      </div>

      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row">
          <span>ActionsPoint © {new Date().getFullYear()}</span>
          <div className="flex gap-4">
            <Link to="/docs" className="hover:text-foreground">Documentation</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
