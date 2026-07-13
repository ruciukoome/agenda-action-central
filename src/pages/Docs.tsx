import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Target, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DocsSidebar, OnThisPage, useActiveSection } from "@/components/docs/DocsSidebar";
import { docsSections } from "@/components/docs/sections";

export default function Docs() {
  const { active: activeId, scrollToSection } = useActiveSection();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = docsSections.find((s) => s.id === activeId) ?? docsSections[0];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open topics">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-6">
                <SheetTitle className="mb-4 text-sm font-semibold">Topics</SheetTitle>
                <DocsSidebar
                  activeId={activeId}
                  onNavigate={(id) => {
                    setMobileOpen(false);
                    scrollToSection(id);
                  }}
                />
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-sm">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">ActionsPoint</span>
              <span className="ml-1 hidden text-sm text-muted-foreground sm:inline">Docs</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <span className="rounded-md px-3 py-1.5 font-medium text-foreground bg-muted/60 border border-border/60">
              Guides
            </span>
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Product
            </Link>
            <Link
              to="/auth"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Sign in
            </Link>
          </nav>

          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex gap-10 lg:gap-14 py-10 lg:py-14">
          {/* Left sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              <DocsSidebar activeId={activeId} onNavigate={(id) => scrollToSection(id)} />
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 flex-1 max-w-3xl">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Docs</span>
              <ChevronRight className="h-3 w-3" />
              <span>{activeSection.group}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{activeSection.title}</span>
            </div>

            <header className="mb-12 border-b border-border/60 pb-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                ActionsPoint Documentation
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-[2.75rem] leading-[1.1]">
                Everything you need to run accountable follow-through
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground max-w-2xl">
                Learn how ActionsPoint helps teams turn meeting decisions into tracked, owned, and
                reported action items — from first sign-up to organization-wide compliance.
              </p>
            </header>

            <div className="space-y-16">
              {docsSections.map((s) => (
                <section
                  key={s.id}
                  id={`section-${s.id}`}
                  className="scroll-mt-28"
                  aria-labelledby={`heading-${s.id}`}
                >
                  <h2
                    id={`heading-${s.id}`}
                    className="mb-5 text-[1.75rem] font-semibold tracking-tight leading-tight"
                  >
                    {s.title}
                  </h2>
                  <div className="space-y-3 text-[15px] leading-relaxed">{s.content}</div>
                </section>
              ))}
            </div>

            <footer className="mt-20 rounded-xl border border-border/60 bg-muted/30 p-6 text-sm">
              <div className="font-medium mb-1">Need more help?</div>
              <p className="text-muted-foreground">
                Reach out to your organization admin, or contact support from your account settings.
              </p>
            </footer>
          </article>

          {/* Right on-this-page */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <OnThisPage activeId={activeId} onNavigate={(id) => scrollToSection(id)} />
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>ActionsPoint © {new Date().getFullYear()}</span>
          <div className="flex gap-5">
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
