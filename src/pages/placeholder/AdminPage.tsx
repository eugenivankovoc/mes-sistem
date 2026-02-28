import { useSetPageTitle } from "@/hooks/useSetPageTitle";

export default function AdminPage() {
  useSetPageTitle("Admin postavke");
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Admin postavke — uskoro</p>
    </div>
  );
}
