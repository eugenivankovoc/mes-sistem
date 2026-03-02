import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { useIsTablet } from "@/hooks/use-mobile";

const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";

function getDefaultOpen(isTablet: boolean): boolean {
  if (isTablet) return false; // collapsed by default on tablet
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export function ManagerLayout() {
  const isTablet = useIsTablet();

  const handleOpenChange = (open: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!open));
    } catch {
      // ignore
    }
  };

  return (
    <SidebarProvider defaultOpen={getDefaultOpen(isTablet)} onOpenChange={handleOpenChange}>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
