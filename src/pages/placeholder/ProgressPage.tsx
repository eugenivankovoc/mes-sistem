import { useSetPageTitle } from "@/hooks/useSetPageTitle";

export default function ProgressPage() {
  useSetPageTitle("Napredak naloga");
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Napredak naloga — uskoro</p>
    </div>
  );
}
