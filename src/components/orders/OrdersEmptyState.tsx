import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onCreateClick: () => void;
}

export function OrdersEmptyState({ onCreateClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Nema naloga</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Nema naloga koji odgovaraju vašim filterima.
      </p>
      <Button onClick={onCreateClick}>Kreirajte prvi nalog</Button>
    </div>
  );
}
