import { useSetPageTitle } from "@/hooks/useSetPageTitle";

export default function BatchesPage() {
  useSetPageTitle("Batch formacija");
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Batch formacija — uskoro</p>
    </div>
  );
}
