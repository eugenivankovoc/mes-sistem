import {
  ClipboardList,
  Archive,
  BarChart3,
  Layers,
  PieChart,
  Settings,
  LogOut,
  ChevronLeft,
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
  const { state, toggleSidebar } = useSidebar();
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
        {/* Logo area – 64px height */}
        <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
          <Factory className="h-5 w-5 text-sidebar-foreground shrink-0" />
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">
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

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        size="lg"
                        className={
                          isActive
                            ? "bg-sidebar-active border-l-[3px] border-l-sidebar-primary text-sidebar-foreground h-12"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground h-12"
                        }
                      >
                        <NavLink to={item.url} className="flex items-center gap-3 px-4 py-2">
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {/* Logout */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip="Odjava"
                className="text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm">Odjava</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Collapse toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleSidebar}
                tooltip={collapsed ? "Proširi" : "Skupi"}
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150"
              >
                <ChevronLeft
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                    collapsed ? "rotate-180" : ""
                  }`}
                />
                {!collapsed && <span className="text-sm">Skupi</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
