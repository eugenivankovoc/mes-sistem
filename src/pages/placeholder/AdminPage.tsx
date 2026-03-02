import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UsersTab } from "@/components/admin/UsersTab";
import { WorkstationsTab } from "@/components/admin/WorkstationsTab";
import { CustomersTab } from "@/components/admin/CustomersTab";

export default function AdminPage() {
  useSetPageTitle("Admin postavke");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger
            value="users"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-primary transition-colors"
          >
            Korisnici
          </TabsTrigger>
          <TabsTrigger
            value="workstations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-primary transition-colors"
          >
            Radne stanice
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-primary transition-colors"
          >
            Klijenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="workstations">
          <WorkstationsTab />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
