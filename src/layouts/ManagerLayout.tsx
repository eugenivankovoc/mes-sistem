import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

const pageTitles: Record<string, string> = {
  "/orders": "Upravljanje nalozima",
  "/archive": "Arhiva naloga",
  "/progress": "Napredak naloga",
  "/workstations": "Radne stanice",
  "/batches": "Batch formacija",
  "/reports": "Izvještaji",
  "/admin": "Admin postavke",
};

export function ManagerLayout() {
  const location = useLocation();
  const basePath = "/" + location.pathname.split("/")[1];
  const title = pageTitles[basePath] || "MES Sustav";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title={title} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
