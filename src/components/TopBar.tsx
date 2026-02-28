import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

const roleLabels: Record<string, string> = {
  administrator: "Administrator",
  planner: "Planer",
  operator: "Operater",
};

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { profile, role } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="h-16 flex items-center justify-between border-b border-topbar-border bg-topbar px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-topbar-foreground" />
        <h1 className="text-xl font-bold text-topbar-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* Badge placeholder */}
        </button>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {initials}
          </div>
          {role && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {roleLabels[role] ?? role}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
