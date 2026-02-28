import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  onClear: () => void;
}

export function BulkActionBar({ count, onClear }: Props) {
  if (count < 2) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-lg border bg-card px-4 sm:px-5 py-3 shadow-lg">
      <span className="text-sm font-medium">{count} naloga odabrano</span>
      <div className="hidden sm:block h-5 w-px bg-border" />
      <Button size="sm" className="min-h-[44px] sm:min-h-0">Release selected</Button>
      <Button size="sm" variant="secondary" className="min-h-[44px] sm:min-h-0">Create Batch</Button>
      <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-0">Archive</Button>
      <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
