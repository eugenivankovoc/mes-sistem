import {
  ClipboardList,
  Archive,
  BarChart3,
  Layers,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Factory } from "lucide-react";

const menuItems = [
  { title: "Upravljanje nalozima", url: "/orders", icon: ClipboardList, roles: ["administrator", "planner"] },
  { title: "Arhiva naloga", url: "/archive", icon: Archive, roles: ["administrator", "planner"] },
  { title: "Napredak naloga", url: "/progress", icon: BarChart3, roles: ["administrator", "planner"] },
  { title: "Batch formacija", url: "/batches", icon: Layers, roles: ["administrator", "planner"] },
  { title: "Izvještaji", url: "/reports", icon: PieChart, roles: ["administrator", "planner"] },
  { title: "Admin postavke", url: "/admin", icon: Settings, roles: ["administrator"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();

  const filteredItems = menuItems.filter((item) => role && item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="border-r-0">
        <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
          <Factory className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
              MES Sustav
            </span>
          )}
        </div>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.url);
                  const menuButton = (
                    <SidebarMenuButton
                      asChild
                      className={
                        isActive
                          ? "bg-sidebar-active border-l-[3px] border-l-sidebar-primary text-sidebar-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                          <TooltipContent side="right">{item.title}</TooltipContent>
                        </Tooltip>
                      ) : (
                        menuButton
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleSignOut}
                      className="text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">Odjava</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Odjava</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
