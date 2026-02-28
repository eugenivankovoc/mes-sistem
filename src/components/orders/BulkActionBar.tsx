import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  onClear: () => void;
}

export function BulkActionBar({ count, onClear }: Props) {
  if (count < 2) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-card px-5 py-3 shadow-lg">
      <span className="text-sm font-medium">{count} naloga odabrano</span>
      <div className="h-5 w-px bg-border" />
      <Button size="sm">Release selected</Button>
      <Button size="sm" variant="secondary">Create Batch</Button>
      <Button size="sm" variant="outline">Archive</Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
