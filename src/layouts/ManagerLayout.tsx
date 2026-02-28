import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

const pageTitles: Record<string, string> = {
  "/orders": "Upravljanje nalozima",
  "/archive": "Arhiva naloga",
  "/progress": "Napredak naloga",
  "/batches": "Batch formacija",
  "/reports": "Izvještaji",
  "/admin": "Admin postavke",
};

const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";

export function ManagerLayout() {
  const location = useLocation();
  const basePath = "/" + location.pathname.split("/")[1];
  const title = pageTitles[basePath] || "MES Sustav";

  // Persist sidebar collapse state in localStorage
  const [defaultOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === "true" ? false : true; // stored "true" means collapsed
    } catch {
      return true;
    }
  });

  const handleOpenChange = (open: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!open));
    } catch {
      // ignore
    }
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar title={title} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
