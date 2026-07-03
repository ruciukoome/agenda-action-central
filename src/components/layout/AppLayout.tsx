import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { UserMenu } from "@/components/navigation/UserMenu";
import { OrgSwitcher } from "@/components/navigation/OrgSwitcher";
import { useOrganization } from "@/contexts/OrganizationContext";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const { organization } = useOrganization();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1 min-w-0">
              {title && (
                <div className="flex items-baseline gap-2 min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">
                    {title}
                  </h1>
                  {organization && (
                    <span className="text-xs text-muted-foreground truncate hidden md:inline">
                      {organization.name}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <OrgSwitcher />
              {actions}
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>

          <footer className="border-t py-4 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>ActionsPoint © {new Date().getFullYear()}</span>
              <div className="flex gap-4">
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
