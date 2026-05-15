import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  KanbanSquare,
  ClipboardList,
  PlusCircle,
  ListChecks,
  Settings,
  Building2,
  Shield,
  Users,
  LogOut,
  Target,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/lib/toast-wrapper";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Action Items", url: "/app", icon: KanbanSquare },
  { title: "My Actions", url: "/my-actions", icon: ClipboardList },
  { title: "Add Action", url: "/add-action", icon: PlusCircle },
  { title: "Manage Actions", url: "/managed-actions", icon: ListChecks },
];

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  // On mobile the sidebar opens as a full sheet — always show labels there.
  const collapsed = !isMobile && state === "collapsed";
  const location = useLocation();
  const { signOut, session } = useAuth();
  const { organization, isOrgAdmin, isSuperAdmin } = useOrganization();

  const isActive = (path: string) =>
    path === "/app"
      ? location.pathname === "/app"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const linkClass = (path: string) =>
    cn(
      "flex items-center gap-2 w-full",
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "hover:bg-sidebar-accent/50"
    );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out", {
        description: "You have been signed out successfully.",
      });
    } catch {
      toast.error("Error signing out");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/app" className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base truncate">ActionPoint</span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={linkClass(item.url)}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={linkClass(item.url)}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {organization && isOrgAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Organization">
                    <NavLink to="/organization" className={linkClass("/organization")}>
                      <Building2 className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Organization</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isSuperAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Super Admin">
                      <NavLink to="/super-admin" end className={linkClass("/super-admin")}>
                        <Shield className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Super Admin</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Users & Roles">
                      <NavLink to="/super-admin/users" className={linkClass("/super-admin/users")}>
                        <Users className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Users & Roles</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {session?.user && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
