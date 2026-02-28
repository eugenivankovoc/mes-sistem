import { useSetPageTitle } from "@/hooks/useSetPageTitle";

export default function ArchivePage() {
  useSetPageTitle("Arhiva naloga");
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Arhiva naloga — uskoro</p>
    </div>
  );
}
