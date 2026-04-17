import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { UserMenu } from "@/components/navigation/UserMenu";
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
          <header className="sticky top-0 z-40 h-14 flex items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              {title && (
                <div className="flex items-baseline gap-3 min-w-0">
                  <h1 className="text-lg font-semibold tracking-tight truncate">
                    {title}
                  </h1>
                  {organization && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                      {organization.name}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
