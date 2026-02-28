import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const roleLabels: Record<string, string> = {
  administrator: "Administrator",
  planner: "Planer",
  operator: "Operater",
};

export function TopBar() {
  const { title } = usePageTitle();
  const { profile } = useAuth();
  const role = profile?.role ?? null;
  const { data: unreadCount = 0 } = useUnreadNotifications();
  const { toggleSidebar, isMobile } = useSidebar();

  const fullName = profile?.full_name?.trim() ?? "";
  const displayName = fullName || "–";

  const initials = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "–";

  return (
    <header className="h-16 flex items-center justify-between border-b border-topbar-border bg-topbar px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-150 md:hidden"
            aria-label="Otvori izbornik"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <h1 className="text-xl font-bold text-topbar-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Bell with unread badge */}
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors duration-150">
          <Bell className="h-[22px] w-[22px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Vertical divider */}
        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium text-foreground leading-tight">
              {displayName}
            </span>
            {role && (
              <span className="inline-flex items-center w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground leading-tight">
                {roleLabels[role] ?? role}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
